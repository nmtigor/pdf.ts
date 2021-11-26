/* Copyright 2018 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*81---------------------------------------------------------------------------*/
export var CharacterType;
(function (CharacterType) {
    CharacterType[CharacterType["SPACE"] = 0] = "SPACE";
    CharacterType[CharacterType["ALPHA_LETTER"] = 1] = "ALPHA_LETTER";
    CharacterType[CharacterType["PUNCT"] = 2] = "PUNCT";
    CharacterType[CharacterType["HAN_LETTER"] = 3] = "HAN_LETTER";
    CharacterType[CharacterType["KATAKANA_LETTER"] = 4] = "KATAKANA_LETTER";
    CharacterType[CharacterType["HIRAGANA_LETTER"] = 5] = "HIRAGANA_LETTER";
    CharacterType[CharacterType["HALFWIDTH_KATAKANA_LETTER"] = 6] = "HALFWIDTH_KATAKANA_LETTER";
    CharacterType[CharacterType["THAI_LETTER"] = 7] = "THAI_LETTER";
})(CharacterType || (CharacterType = {}));
function isAlphabeticalScript(charCode) {
    return charCode < 0x2e80;
}
function isAscii(charCode) {
    return (charCode & 0xff80) === 0;
}
function isAsciiAlpha(charCode) {
    return ((charCode >= /* a = */ 0x61 && charCode <= /* z = */ 0x7a) ||
        (charCode >= /* A = */ 0x41 && charCode <= /* Z = */ 0x5a));
}
function isAsciiDigit(charCode) {
    return charCode >= /* 0 = */ 0x30 && charCode <= /* 9 = */ 0x39;
}
function isAsciiSpace(charCode) {
    return (charCode === /* SPACE = */ 0x20 ||
        charCode === /* TAB = */ 0x09 ||
        charCode === /* CR = */ 0x0d ||
        charCode === /* LF = */ 0x0a);
}
function isHan(charCode) {
    return ((charCode >= 0x3400 && charCode <= 0x9fff) ||
        (charCode >= 0xf900 && charCode <= 0xfaff));
}
function isKatakana(charCode) {
    return charCode >= 0x30a0 && charCode <= 0x30ff;
}
function isHiragana(charCode) {
    return charCode >= 0x3040 && charCode <= 0x309f;
}
function isHalfwidthKatakana(charCode) {
    return charCode >= 0xff60 && charCode <= 0xff9f;
}
function isThai(charCode) {
    return (charCode & 0xff80) === 0x0e00;
}
/**
 * This function is based on the word-break detection implemented in:
 * https://hg.mozilla.org/mozilla-central/file/tip/intl/lwbrk/WordBreaker.cpp
 */
export function getCharacterType(charCode) {
    if (isAlphabeticalScript(charCode)) {
        if (isAscii(charCode)) {
            if (isAsciiSpace(charCode)) {
                return CharacterType.SPACE;
            }
            else if (isAsciiAlpha(charCode) ||
                isAsciiDigit(charCode) ||
                charCode === /* UNDERSCORE = */ 0x5f) {
                return CharacterType.ALPHA_LETTER;
            }
            return CharacterType.PUNCT;
        }
        else if (isThai(charCode)) {
            return CharacterType.THAI_LETTER;
        }
        else if (charCode === /* NBSP = */ 0xa0) {
            return CharacterType.SPACE;
        }
        return CharacterType.ALPHA_LETTER;
    }
    if (isHan(charCode)) {
        return CharacterType.HAN_LETTER;
    }
    else if (isKatakana(charCode)) {
        return CharacterType.KATAKANA_LETTER;
    }
    else if (isHiragana(charCode)) {
        return CharacterType.HIRAGANA_LETTER;
    }
    else if (isHalfwidthKatakana(charCode)) {
        return CharacterType.HALFWIDTH_KATAKANA_LETTER;
    }
    return CharacterType.ALPHA_LETTER;
}
/*81---------------------------------------------------------------------------*/
//# sourceMappingURL=pdf_find_utils.js.map