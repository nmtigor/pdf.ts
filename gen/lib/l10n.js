/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2021
 */
var Ns_webL10n;
(function (Ns_webL10n) {
    let gL10nData = Object.create(null);
    let gTextData = "";
    const gTextProp = "textContent";
    let gLanguage = "";
    const gMacros = Object.create(null);
    let ReadyState;
    (function (ReadyState) {
        ReadyState[ReadyState["loading"] = 0] = "loading";
        ReadyState[ReadyState["complete"] = 1] = "complete";
        ReadyState[ReadyState["interactive"] = 2] = "interactive";
    })(ReadyState || (ReadyState = {}));
    let gReadyState = ReadyState.loading;
    /**
     * Synchronously loading l10n resources significantly minimizes flickering
     * from displaying the app with non-localized strings and then updating the
     * strings. Although this will block all script execution on this page, we
     * expect that the l10n resources are available locally on flash-storage.
     *
     * As synchronous XHR is generally considered as a bad idea, we're still
     * loading l10n resources asynchronously -- but we keep this in a setting,
     * just in case... and applications using this library should hide their
     * content until the `localized' event happens.
     */
    const gAsyncResourceLoading = true; // read-only
    /**
     * DOM helpers for the so-called "HTML API".
     *
     * These functions are written for modern browsers. For old versions of IE,
     * they're overridden in the 'startup' section at the end of this file.
     */
    function getL10nResourceLinks() {
        return document.querySelectorAll('link[type="application/l10n"]');
    }
    function getL10nDictionary() {
        const script = document.querySelector('script[type="application/l10n"]');
        // TODO: support multiple and external JSON dictionaries
        return script ? JSON.parse(script.innerHTML) : null;
    }
    function getTranslatableChildren(element) {
        return element.querySelectorAll('*[data-l10n-id]');
        // return element ? element.querySelectorAll('*[data-l10n-id]') : [];
    }
    function getL10nAttributes(element) {
        if (!element)
            return {};
        const l10nId = element.getAttribute('data-l10n-id');
        const l10nArgs = element.getAttribute('data-l10n-args');
        let args = Object.create(null);
        if (l10nArgs) {
            try {
                args = JSON.parse(l10nArgs);
            }
            catch (e) {
                console.warn(`could not parse arguments for #${l10nId}`);
            }
        }
        return { id: l10nId, args };
    }
    function xhrLoadText(url, onSuccess = (response) => { }, onFailure = () => { }) {
        // onSuccess = onSuccess || function _onSuccess(data) {};
        // onFailure = onFailure || function _onFailure() {};
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, gAsyncResourceLoading);
        if (xhr.overrideMimeType) {
            xhr.overrideMimeType('text/plain; charset=utf-8');
        }
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 0) {
                    onSuccess(xhr.responseText);
                }
                else {
                    onFailure();
                }
            }
        };
        xhr.onerror = onFailure;
        xhr.ontimeout = onFailure;
        // in Firefox OS with the app:// protocol, trying to XHR a non-existing
        // URL will raise an exception here -- hence this ugly try...catch.
        try {
            xhr.send(null);
        }
        catch (e) {
            onFailure();
        }
    }
    /**
     * l10n resource parser:
     *  - reads (async XHR) the l10n resource matching `lang';
     *  - imports linked resources (synchronously) when specified;
     *  - parses the text data (fills `gL10nData' and `gTextData');
     *  - triggers success/failure callbacks when done.
     *
     * @param {string} href
     *    URL of the l10n resource to parse.
     *
     * @param {string} lang
     *    locale (language) to parse. Must be a lowercase string.
     *
     * @param {Function} successCallback
     *    triggered when the l10n resource has been successfully parsed.
     *
     * @param {Function} failureCallback
     *    triggered when the an error has occurred.
     *
     * @return {void}
     *    uses the following global variables: gL10nData, gTextData, gTextProp.
     */
    function parseResource(href, lang, successCallback, failureCallback) {
        const baseURL = href.replace(/[^\/]*$/, '') || './';
        // handle escaped characters (backslashes) in a string
        function evalString(text) {
            if (text.lastIndexOf('\\') < 0)
                return text;
            return text.replace(/\\\\/g, '\\')
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\b/g, '\b')
                .replace(/\\f/g, '\f')
                .replace(/\\{/g, '{')
                .replace(/\\}/g, '}')
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'");
        }
        // parse *.properties text data into an l10n dictionary
        // If gAsyncResourceLoading is false, then the callback will be called
        // synchronously. Otherwise it is called asynchronously.
        function parseProperties(text, parsedPropertiesCallback) {
            const dictionary = Object.create(null);
            // token expressions
            const reBlank = /^\s*|\s*$/;
            const reComment = /^\s*#|^\s*$/;
            const reSection = /^\s*\[(.*)\]\s*$/;
            const reImport = /^\s*@import\s+url\((.*)\)\s*$/i;
            const reSplit = /^([^=\s]*)\s*=\s*(.+)$/; // TODO: escape EOLs with '\'
            // parse the *.properties file into an associative array
            function parseRawLines(rawText, extendedSyntax, parsedRawLinesCallback) {
                const entries = rawText.replace(reBlank, '').split(/[\r\n]+/);
                let currentLang = '*';
                const genericLang = lang.split('-', 1)[0];
                let skipLang = false;
                let match = null;
                function nextEntry() {
                    // Use infinite loop instead of recursion to avoid reaching the
                    // maximum recursion limit for content with many lines.
                    while (true) {
                        if (!entries.length) {
                            parsedRawLinesCallback();
                            return;
                        }
                        const line = entries.shift();
                        // comment or blank line?
                        if (reComment.test(line))
                            continue;
                        // the extended syntax supports [lang] sections and @import rules
                        if (extendedSyntax) {
                            match = reSection.exec(line);
                            if (match) // section start?
                             {
                                // RFC 4646, section 4.4, "All comparisons MUST be performed
                                // in a case-insensitive manner."
                                currentLang = match[1].toLowerCase();
                                skipLang = (currentLang !== '*') &&
                                    (currentLang !== lang) && (currentLang !== genericLang);
                                continue;
                            }
                            else if (skipLang) {
                                continue;
                            }
                            match = reImport.exec(line);
                            if (match) // @import rule?
                             {
                                loadImport(baseURL + match[1], nextEntry);
                                return;
                            }
                        }
                        // key-value pair
                        const tmp = line.match(reSplit);
                        if (tmp && tmp.length === 3) {
                            dictionary[tmp[1]] = evalString(tmp[2]);
                        }
                    }
                }
                nextEntry();
            }
            // import another *.properties file
            function loadImport(url, callback) {
                xhrLoadText(url, function (content) {
                    parseRawLines(content, false, callback); // don't allow recursive imports
                }, function () {
                    console.warn(url + ' not found.');
                    callback();
                });
            }
            // fill the dictionary
            parseRawLines(text, true, () => {
                parsedPropertiesCallback(dictionary);
            });
        }
        // load and parse l10n data (warning: global variables are used here)
        xhrLoadText(href, (response) => {
            gTextData += response; // mostly for debug
            // parse *.properties text data into an l10n dictionary
            parseProperties(response, (data) => {
                // find attribute descriptions, if any
                for (const key in data) {
                    let id;
                    let prop;
                    const index = key.lastIndexOf('.');
                    if (index > 0) // an attribute has been specified
                     {
                        id = key.substring(0, index);
                        prop = key.substring(index + 1);
                    }
                    else { // no attribute: assuming text content by default
                        id = key;
                        prop = gTextProp;
                    }
                    if (!gL10nData[id]) {
                        gL10nData[id] = Object.create(null);
                    }
                    gL10nData[id][prop] = data[key];
                }
                // trigger callback
                successCallback?.();
            });
        }, failureCallback);
    }
    /**
     * load all resource files
     */
    class L10nResourceLink {
        href;
        constructor(link) {
            this.href = link.href;
        }
        // Note: If |gAsyncResourceLoading| is false, then the following callbacks
        // are synchronously called.
        load(lang, callback) {
            parseResource(this.href, lang, callback, () => {
                console.warn(`${this.href} not found.`);
                // lang not found, used default resource instead
                console.warn(`"${lang}" resource not found`);
                gLanguage = "";
                // Resource not loaded, but we still need to call the callback.
                callback();
            });
        }
    }
    /**
     * load and parse all resources for the specified locale
     */
    function loadLocale(lang, callback = () => { }) {
        // // #if DEV && INFO
        //   console.log(`${global.indent}>>>>>>> Ns_webL10n.loadLocale() >>>>>>>`);
        // // #endif
        // RFC 4646, section 2.1 states that language tags have to be treated as
        // case-insensitive. Convert to lowercase for case-insensitive comparisons.
        if (lang) {
            lang = lang.toLowerCase();
        }
        callback = callback || function _callback() { };
        clear();
        gLanguage = lang;
        // check all <link type="application/l10n" href="..." /> nodes
        // and load the resource files
        const langLinks = getL10nResourceLinks();
        const langCount = langLinks.length;
        if (langCount === 0) {
            // we might have a pre-compiled dictionary instead
            const dict = getL10nDictionary();
            if (dict && dict.locales && dict.default_locale) {
                console.log('using the embedded JSON directory, early way out');
                gL10nData = dict.locales[lang];
                if (!gL10nData) {
                    const defaultLocale = dict.default_locale.toLowerCase();
                    for (let anyCaseLang in dict.locales) {
                        anyCaseLang = anyCaseLang.toLowerCase();
                        if (anyCaseLang === lang) {
                            gL10nData = dict.locales[lang];
                            break;
                        }
                        else if (anyCaseLang === defaultLocale) {
                            gL10nData = dict.locales[defaultLocale];
                        }
                    }
                }
                callback();
            }
            else {
                console.log('no resource to load, early way out');
            }
            // early way out
            gReadyState = ReadyState.complete;
            // // #if DEV && INFO
            //   global.outdent;
            // // #endif
            return;
        }
        // start the callback when all resources are loaded
        let gResourceCount = 0;
        const onResourceLoaded = () => {
            gResourceCount++;
            if (gResourceCount >= langCount) {
                callback();
                gReadyState = ReadyState.complete;
            }
        };
        for (let i = 0; i < langCount; i++) {
            const resource = new L10nResourceLink(langLinks[i]);
            resource.load(lang, onResourceLoaded);
        }
        // // #if DEV && INFO
        //   global.outdent;
        // // #endif
    }
    /**
     * clear all l10n data
     */
    function clear() {
        gL10nData = Object.create(null);
        gTextData = "";
        gLanguage = "";
        // TODO: clear all non predefined macros.
        // There's no such macro /yet/ but we're planning to have some...
    }
    /**
     * Get rules for plural forms (shared with JetPack), see:
     * http://unicode.org/repos/cldr-tmp/trunk/diff/supplemental/language_plural_rules.html
     * https://github.com/mozilla/addon-sdk/blob/master/python-lib/plural-rules-generator.p
     *
     * @param {string} lang
     *    locale (language) used.
     *
     * @return {Function}
     *    returns a function that gives the plural form name for a given integer:
     *       const fun = getPluralRules('en');
     *       fun(1)    -> "one"
     *       fun(0)    -> "other"
     *       fun(1000) -> "other".
     */
    function getPluralRules(lang) {
        const locales2rules = {
            'af': 3,
            'ak': 4,
            'am': 4,
            'ar': 1,
            'asa': 3,
            'az': 0,
            'be': 11,
            'bem': 3,
            'bez': 3,
            'bg': 3,
            'bh': 4,
            'bm': 0,
            'bn': 3,
            'bo': 0,
            'br': 20,
            'brx': 3,
            'bs': 11,
            'ca': 3,
            'cgg': 3,
            'chr': 3,
            'cs': 12,
            'cy': 17,
            'da': 3,
            'de': 3,
            'dv': 3,
            'dz': 0,
            'ee': 3,
            'el': 3,
            'en': 3,
            'eo': 3,
            'es': 3,
            'et': 3,
            'eu': 3,
            'fa': 0,
            'ff': 5,
            'fi': 3,
            'fil': 4,
            'fo': 3,
            'fr': 5,
            'fur': 3,
            'fy': 3,
            'ga': 8,
            'gd': 24,
            'gl': 3,
            'gsw': 3,
            'gu': 3,
            'guw': 4,
            'gv': 23,
            'ha': 3,
            'haw': 3,
            'he': 2,
            'hi': 4,
            'hr': 11,
            'hu': 0,
            'id': 0,
            'ig': 0,
            'ii': 0,
            'is': 3,
            'it': 3,
            'iu': 7,
            'ja': 0,
            'jmc': 3,
            'jv': 0,
            'ka': 0,
            'kab': 5,
            'kaj': 3,
            'kcg': 3,
            'kde': 0,
            'kea': 0,
            'kk': 3,
            'kl': 3,
            'km': 0,
            'kn': 0,
            'ko': 0,
            'ksb': 3,
            'ksh': 21,
            'ku': 3,
            'kw': 7,
            'lag': 18,
            'lb': 3,
            'lg': 3,
            'ln': 4,
            'lo': 0,
            'lt': 10,
            'lv': 6,
            'mas': 3,
            'mg': 4,
            'mk': 16,
            'ml': 3,
            'mn': 3,
            'mo': 9,
            'mr': 3,
            'ms': 0,
            'mt': 15,
            'my': 0,
            'nah': 3,
            'naq': 7,
            'nb': 3,
            'nd': 3,
            'ne': 3,
            'nl': 3,
            'nn': 3,
            'no': 3,
            'nr': 3,
            'nso': 4,
            'ny': 3,
            'nyn': 3,
            'om': 3,
            'or': 3,
            'pa': 3,
            'pap': 3,
            'pl': 13,
            'ps': 3,
            'pt': 3,
            'rm': 3,
            'ro': 9,
            'rof': 3,
            'ru': 11,
            'rwk': 3,
            'sah': 0,
            'saq': 3,
            'se': 7,
            'seh': 3,
            'ses': 0,
            'sg': 0,
            'sh': 11,
            'shi': 19,
            'sk': 12,
            'sl': 14,
            'sma': 7,
            'smi': 7,
            'smj': 7,
            'smn': 7,
            'sms': 7,
            'sn': 3,
            'so': 3,
            'sq': 3,
            'sr': 11,
            'ss': 3,
            'ssy': 3,
            'st': 3,
            'sv': 3,
            'sw': 3,
            'syr': 3,
            'ta': 3,
            'te': 3,
            'teo': 3,
            'th': 0,
            'ti': 4,
            'tig': 3,
            'tk': 3,
            'tl': 4,
            'tn': 3,
            'to': 0,
            'tr': 0,
            'ts': 3,
            'tzm': 22,
            'uk': 11,
            'ur': 3,
            've': 3,
            'vi': 0,
            'vun': 3,
            'wa': 4,
            'wae': 3,
            'wo': 0,
            'xh': 3,
            'xog': 3,
            'yo': 0,
            'zh': 0,
            'zu': 3
        };
        // type Rule = L2R[keyof L2R];
        // utility functions for plural rules methods
        function isIn(n, list) {
            return list.indexOf(n) !== -1;
        }
        function isBetween(n, start, end) {
            return start <= n && n <= end;
        }
        // list of all plural rules methods:
        // map an integer to the plural form name to use
        const pluralRules = {
            0: (n) => "other",
            1: (n) => {
                if ((isBetween((n % 100), 3, 10)))
                    return "few";
                if (n === 0)
                    return "zero";
                if ((isBetween((n % 100), 11, 99)))
                    return "many";
                if (n === 2)
                    return "two";
                if (n === 1)
                    return "one";
                return "other";
            },
            2: (n) => {
                if (n !== 0 && (n % 10) === 0)
                    return "many";
                if (n === 2)
                    return "two";
                if (n === 1)
                    return "one";
                return "other";
            },
            3: (n) => {
                if (n === 1)
                    return "one";
                return "other";
            },
            4: (n) => {
                if ((isBetween(n, 0, 1)))
                    return "one";
                return "other";
            },
            5: (n) => {
                if ((isBetween(n, 0, 2)) && n != 2)
                    return "one";
                return "other";
            },
            6: (n) => {
                if (n === 0)
                    return "zero";
                if ((n % 10) === 1 && (n % 100) != 11)
                    return "one";
                return "other";
            },
            7: (n) => {
                if (n === 2)
                    return "two";
                if (n === 1)
                    return "one";
                return "other";
            },
            8: (n) => {
                if ((isBetween(n, 3, 6)))
                    return "few";
                if ((isBetween(n, 7, 10)))
                    return "many";
                if (n === 2)
                    return "two";
                if (n === 1)
                    return "one";
                return "other";
            },
            9: (n) => {
                if (n === 0 || n != 1 && (isBetween((n % 100), 1, 19)))
                    return "few";
                if (n === 1)
                    return "one";
                return "other";
            },
            10: (n) => {
                if ((isBetween((n % 10), 2, 9)) && !(isBetween((n % 100), 11, 19)))
                    return "few";
                if ((n % 10) === 1 && !(isBetween((n % 100), 11, 19)))
                    return "one";
                return "other";
            },
            11: (n) => {
                if ((isBetween((n % 10), 2, 4)) && !(isBetween((n % 100), 12, 14)))
                    return "few";
                if ((n % 10) === 0 ||
                    (isBetween((n % 10), 5, 9)) ||
                    (isBetween((n % 100), 11, 14)))
                    return "many";
                if ((n % 10) === 1 && (n % 100) != 11)
                    return "one";
                return "other";
            },
            12: (n) => {
                if ((isBetween(n, 2, 4)))
                    return "few";
                if (n === 1)
                    return "one";
                return "other";
            },
            13: (n) => {
                if ((isBetween((n % 10), 2, 4)) && !(isBetween((n % 100), 12, 14)))
                    return "few";
                if (n != 1 && (isBetween((n % 10), 0, 1)) ||
                    (isBetween((n % 10), 5, 9)) ||
                    (isBetween((n % 100), 12, 14)))
                    return "many";
                if (n === 1)
                    return "one";
                return "other";
            },
            14: (n) => {
                if ((isBetween((n % 100), 3, 4)))
                    return "few";
                if ((n % 100) === 2)
                    return "two";
                if ((n % 100) === 1)
                    return "one";
                return "other";
            },
            15: (n) => {
                if (n === 0 || (isBetween((n % 100), 2, 10)))
                    return "few";
                if ((isBetween((n % 100), 11, 19)))
                    return "many";
                if (n === 1)
                    return "one";
                return "other";
            },
            16: (n) => {
                if ((n % 10) === 1 && n != 11)
                    return "one";
                return "other";
            },
            17: (n) => {
                if (n === 3)
                    return "few";
                if (n === 0)
                    return "zero";
                if (n === 6)
                    return "many";
                if (n === 2)
                    return "two";
                if (n === 1)
                    return "one";
                return "other";
            },
            18: (n) => {
                if (n === 0)
                    return "zero";
                if ((isBetween(n, 0, 2)) && n !== 0 && n != 2)
                    return "one";
                return "other";
            },
            19: (n) => {
                if ((isBetween(n, 2, 10)))
                    return "few";
                if ((isBetween(n, 0, 1)))
                    return "one";
                return "other";
            },
            20: (n) => {
                if ((isBetween((n % 10), 3, 4) || ((n % 10) === 9)) && !(isBetween((n % 100), 10, 19) ||
                    isBetween((n % 100), 70, 79) ||
                    isBetween((n % 100), 90, 99)))
                    return "few";
                if ((n % 1000000) === 0 && n !== 0)
                    return "many";
                if ((n % 10) === 2 && !isIn((n % 100), [12, 72, 92]))
                    return "two";
                if ((n % 10) === 1 && !isIn((n % 100), [11, 71, 91]))
                    return "one";
                return "other";
            },
            21: (n) => {
                if (n === 0)
                    return "zero";
                if (n === 1)
                    return "one";
                return "other";
            },
            22: (n) => {
                if ((isBetween(n, 0, 1)) || (isBetween(n, 11, 99)))
                    return "one";
                return "other";
            },
            23: (n) => {
                if ((isBetween((n % 10), 1, 2)) || (n % 20) === 0)
                    return "one";
                return "other";
            },
            24: (n) => {
                if ((isBetween(n, 3, 10) || isBetween(n, 13, 19)))
                    return "few";
                if (isIn(n, [2, 12]))
                    return "two";
                if (isIn(n, [1, 11]))
                    return "one";
                return "other";
            }
        };
        // return a function that gives the plural form name for a given integer
        const index = locales2rules[lang.replace(/-.*$/, '')];
        if (!(index in pluralRules)) {
            console.warn('plural form unknown for [' + lang + ']');
            return () => "other";
        }
        return pluralRules[index];
    }
    // pre-defined 'plural' macro
    gMacros.plural = (str, param, key, prop) => {
        const n = parseFloat(param);
        if (isNaN(n))
            return str;
        // TODO: support other properties (l20n still doesn't...)
        if (prop != gTextProp)
            return str;
        // initialize _pluralRules
        if (!gMacros._pluralRules) {
            gMacros._pluralRules = getPluralRules(gLanguage);
        }
        const index = `[${gMacros._pluralRules(n)}]'`;
        // try to find a [zero|one|two] key if it's defined
        if (n === 0 && (key + '[zero]') in gL10nData) {
            str = gL10nData[key + '[zero]'][prop];
        }
        else if (n === 1 && (key + '[one]') in gL10nData) {
            str = gL10nData[key + '[one]'][prop];
        }
        else if (n === 2 && (key + '[two]') in gL10nData) {
            str = gL10nData[key + '[two]'][prop];
        }
        else if ((key + index) in gL10nData) {
            str = gL10nData[key + index][prop];
        }
        else if ((key + '[other]') in gL10nData) {
            str = gL10nData[key + '[other]'][prop];
        }
        return str;
    };
    /**
     * l10n dictionary functions
     */
    /**
     * fetch an l10n object, warn if not found, apply `args' if possible
     */
    function getL10nData(key, args, fallback) {
        let data = gL10nData[key];
        if (!data) {
            console.warn(`#${key} is undefined.`);
            if (!fallback)
                return undefined;
            data = fallback;
        }
        /** This is where l10n expressions should be processed.
          * The plan is to support C-style expressions from the l20n project;
          * until then, only two kinds of simple expressions are supported:
          *   {[ index ]} and {{ arguments }}.
          */
        const rv = Object.create(null);
        for (const prop in data) {
            let str = data[prop];
            str = substIndexes(str, args, key, prop);
            str = substArguments(str, args, key);
            rv[prop] = str;
        }
        return rv;
    }
    /**
     * replace {[macros]} with their values
     */
    function substIndexes(str, args, key, prop) {
        const reIndex = /\{\[\s*([a-zA-Z]+)\(([a-zA-Z]+)\)\s*\]\}/;
        const reMatch = reIndex.exec(str);
        if (!reMatch || !reMatch.length)
            return str;
        // an index/macro has been found
        // Note: at the moment, only one parameter is supported
        const macroName = reMatch[1];
        const paramName = reMatch[2];
        let param;
        if (args && paramName in args) {
            param = args[paramName];
        }
        else if (paramName in gL10nData) {
            param = gL10nData[paramName];
        }
        // there's no macro parser yet: it has to be defined in gMacros
        if (macroName in gMacros) {
            const macro = gMacros[macroName];
            str = macro(str, param, key, prop);
        }
        return str;
    }
    // replace {{arguments}} with their values
    function substArguments(str, args, key) {
        const reArgs = /\{\{\s*(.+?)\s*\}\}/g;
        return str.replace(reArgs, (matched_text, arg) => {
            if (args && arg in args) {
                return args[arg];
            }
            if (arg in gL10nData) {
                return gL10nData[arg];
            }
            console.log(`argument {{${arg}}} for #${key} is undefined.`);
            return matched_text;
        });
    }
    // translate an HTML element
    function translateElement(element) {
        const l10n = getL10nAttributes(element);
        if (!l10n.id)
            return;
        // get the related l10n object
        const data = getL10nData(l10n.id, l10n.args);
        if (!data) {
            console.warn(`#${l10n.id} is undefined.`);
            return;
        }
        // translate element (TODO: security checks?)
        if (data[gTextProp]) // XXX
         {
            if (getChildElementCount(element) === 0) {
                element[gTextProp] = data[gTextProp];
            }
            else {
                // this element has element children: replace the content of the first
                // (non-empty) child textNode and clear other child textNodes
                const children = element.childNodes;
                let found = false;
                for (let i = 0, l = children.length; i < l; i++) {
                    if (children[i].nodeType === 3 && /\S/.test(children[i].nodeValue)) {
                        if (found) {
                            children[i].nodeValue = '';
                        }
                        else {
                            children[i].nodeValue = data[gTextProp];
                            found = true;
                        }
                    }
                }
                // if no (non-empty) textNode is found, insert a textNode before the
                // first element child.
                if (!found) {
                    const textNode = document.createTextNode(data[gTextProp]);
                    element.insertBefore(textNode, element.firstChild);
                }
            }
            delete data[gTextProp];
        }
        for (const k in data) {
            element[k] = data[k];
        }
    }
    // webkit browsers don't currently support 'children' on SVG elements...
    function getChildElementCount(element) {
        if (element.children) {
            return element.children.length;
        }
        if (typeof element.childElementCount !== 'undefined') {
            return element.childElementCount;
        }
        let count = 0;
        for (let i = 0; i < element.childNodes.length; i++) {
            count += element.nodeType === 1 ? 1 : 0;
        }
        return count;
    }
    /**
     * translate an HTML subtree
     */
    function translateFragment(element) {
        element = element || document.documentElement;
        // check all translatable children (= w/ a `data-l10n-id' attribute)
        const children = getTranslatableChildren(element);
        const elementCount = children.length;
        for (let i = 0; i < elementCount; i++) {
            translateElement(children[i]);
        }
        // translate element itself if necessary
        translateElement(element);
    }
    let webL10n;
    (function (webL10n) {
        /**
         * get a localized string
         */
        function get(key, args, fallbackString) {
            const index = key.lastIndexOf('.');
            let prop = gTextProp;
            if (index > 0) // An attribute has been specified
             {
                prop = key.substring(index + 1);
                key = key.substring(0, index);
            }
            let fallback;
            if (fallbackString) {
                fallback = Object.create(null);
                fallback[prop] = fallbackString;
            }
            const data = getL10nData(key, args, fallback);
            if (data && prop in data) {
                return data[prop];
            }
            return `{{${key}}}`;
        }
        webL10n.get = get;
        // debug
        const getData = () => gL10nData;
        const getText = () => gTextData;
        /**
         * get the document language
         */
        webL10n.getLanguage = () => gLanguage;
        /**
         * set the document language
         */
        function setLanguage(lang, callback) {
            loadLocale(lang, () => {
                if (callback)
                    callback();
            });
        }
        webL10n.setLanguage = setLanguage;
        /**
         * get the direction (ltr|rtl) of the current language
         */
        function getDirection() {
            // http://www.w3.org/International/questions/qa-scripts
            // Arabic, Hebrew, Farsi, Pashto, Urdu
            const rtlList = ['ar', 'he', 'fa', 'ps', 'ur'];
            const shortCode = gLanguage.split('-', 1)[0];
            return (rtlList.indexOf(shortCode) >= 0) ? 'rtl' : 'ltr';
        }
        webL10n.getDirection = getDirection;
        /**
         * translate an element or document fragment
         */
        webL10n.translate = translateFragment;
        /**
         * this can be used to prevent race conditions
         */
        const getReadyState = () => gReadyState;
        function ready(callback) {
            if (!callback) {
                return;
            }
            else if (gReadyState === ReadyState.complete
                || gReadyState === ReadyState.interactive) {
                window.setTimeout(function () {
                    callback();
                });
            }
            else if (document.addEventListener) {
                document.addEventListener('localized', function once() {
                    document.removeEventListener('localized', once);
                    callback();
                });
            }
        }
    })(webL10n = Ns_webL10n.webL10n || (Ns_webL10n.webL10n = {}));
})(Ns_webL10n || (Ns_webL10n = {}));
export var webL10n = Ns_webL10n.webL10n;
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=l10n.js.map