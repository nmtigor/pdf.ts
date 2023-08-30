/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2023
 */

/* Copyright 2023 Mozilla Foundation
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

import { validateFontName } from "./core_utils.ts";
import type { GlobalIdFactory } from "./document.ts";
import { normalizeFontName } from "./fonts_utils.ts";
/*80--------------------------------------------------------------------------*/

type Style_ = {
  style: "normal" | "italic";
  weight: string;
};

const NORMAL: Style_ = {
  style: "normal",
  weight: "normal",
};
const BOLD: Style_ = {
  style: "normal",
  weight: "bold",
};
const ITALIC: Style_ = {
  style: "italic",
  weight: "normal",
};
const BOLDITALIC: Style_ = {
  style: "italic",
  weight: "bold",
};

type Ultimate_ = "serif" | "sans-serif" | "monospace";

type Substitution_ = {
  alias?: string;
  local?: string[];
  path?: string;
  fallback?: string;
  style?: Style_;
  ultimate?: Ultimate_;
};

const substitutionMap: Map<string, Substitution_> = new Map([
  [
    "Times-Roman",
    {
      local: [
        "Times New Roman",
        "Times-Roman",
        "Times",
        "Liberation Serif",
        "Nimbus Roman",
        "Nimbus Roman L",
        "Tinos",
        "Thorndale",
        "TeX Gyre Termes",
        "FreeSerif",
        "DejaVu Serif",
        "Bitstream Vera Serif",
        "Ubuntu",
      ],
      style: NORMAL,
      ultimate: "serif",
    },
  ],
  [
    "Times-Bold",
    {
      alias: "Times-Roman",
      style: BOLD,
      ultimate: "serif",
    },
  ],
  [
    "Times-Italic",
    {
      alias: "Times-Roman",
      style: ITALIC,
      ultimate: "serif",
    },
  ],
  [
    "Times-BoldItalic",
    {
      alias: "Times-Roman",
      style: BOLDITALIC,
      ultimate: "serif",
    },
  ],
  [
    "Helvetica",
    {
      local: [
        "Helvetica",
        "Helvetica Neue",
        "Arial",
        "Arial Nova",
        "Liberation Sans",
        "Arimo",
        "Nimbus Sans",
        "Nimbus Sans L",
        "A030",
        "TeX Gyre Heros",
        "FreeSans",
        "DejaVu Sans",
        "Albany",
        "Bitstream Vera Sans",
        "Arial Unicode MS",
        "Microsoft Sans Serif",
        "Apple Symbols",
        "Cantarell",
      ],
      path: "LiberationSans-Regular.ttf",
      style: NORMAL,
      ultimate: "sans-serif",
    },
  ],
  [
    "Helvetica-Bold",
    {
      alias: "Helvetica",
      path: "LiberationSans-Bold.ttf",
      style: BOLD,
      ultimate: "sans-serif",
    },
  ],
  [
    "Helvetica-Oblique",
    {
      alias: "Helvetica",
      path: "LiberationSans-Italic.ttf",
      style: ITALIC,
      ultimate: "sans-serif",
    },
  ],
  [
    "Helvetica-BoldOblique",
    {
      alias: "Helvetica",
      path: "LiberationSans-BoldItalic.ttf",
      style: BOLDITALIC,
      ultimate: "sans-serif",
    },
  ],
  [
    "Courier",
    {
      local: [
        "Courier",
        "Courier New",
        "Liberation Mono",
        "Nimbus Mono",
        "Nimbus Mono L",
        "Cousine",
        "Cumberland",
        "TeX Gyre Cursor",
        "FreeMono",
      ],
      style: NORMAL,
      ultimate: "monospace",
    },
  ],
  [
    "Courier-Bold",
    {
      alias: "Courier",
      style: BOLD,
      ultimate: "monospace",
    },
  ],
  [
    "Courier-Oblique",
    {
      alias: "Courier",
      style: ITALIC,
      ultimate: "monospace",
    },
  ],
  [
    "Courier-BoldOblique",
    {
      alias: "Courier",
      style: BOLDITALIC,
      ultimate: "monospace",
    },
  ],
  [
    "ArialBlack",
    {
      local: ["Arial Black"],
      style: {
        style: "normal",
        weight: "900",
      },
      fallback: "Helvetica-Bold",
    },
  ],
  [
    "ArialBlack-Bold",
    {
      alias: "ArialBlack",
    },
  ],
  [
    "ArialBlack-Italic",
    {
      alias: "ArialBlack",
      style: {
        style: "italic",
        weight: "900",
      },
      fallback: "Helvetica-BoldOblique",
    },
  ],
  [
    "ArialBlack-BoldItalic",
    {
      alias: "ArialBlack-Italic",
    },
  ],
  [
    "ArialNarrow",
    {
      local: [
        "Arial Narrow",
        "Liberation Sans Narrow",
        "Helvetica Condensed",
        "Nimbus Sans Narrow",
        "TeX Gyre Heros Cn",
      ],
      style: NORMAL,
      fallback: "Helvetica",
    },
  ],
  [
    "ArialNarrow-Bold",
    {
      alias: "ArialNarrow",
      style: BOLD,
      fallback: "Helvetica-Bold",
    },
  ],
  [
    "ArialNarrow-Italic",
    {
      alias: "ArialNarrow",
      style: ITALIC,
      fallback: "Helvetica-Oblique",
    },
  ],
  [
    "ArialNarrow-BoldItalic",
    {
      alias: "ArialNarrow",
      style: BOLDITALIC,
      fallback: "Helvetica-BoldOblique",
    },
  ],
  [
    "Calibri",
    {
      local: ["Calibri", "Carlito"],
      style: NORMAL,
      fallback: "Helvetica",
    },
  ],
  [
    "Calibri-Bold",
    {
      alias: "Calibri",
      style: BOLD,
      fallback: "Helvetica-Bold",
    },
  ],
  [
    "Calibri-Italic",
    {
      alias: "Calibri",
      style: ITALIC,
      fallback: "Helvetica-Oblique",
    },
  ],
  [
    "Calibri-BoldItalic",
    {
      alias: "Calibri",
      style: BOLDITALIC,
      fallback: "Helvetica-BoldOblique",
    },
  ],
  [
    "Wingdings",
    {
      local: ["Wingdings", "URW Dingbats"],
      style: NORMAL,
    },
  ],
  [
    "Wingdings-Regular",
    {
      alias: "Wingdings",
    },
  ],
  [
    "Wingdings-Bold",
    {
      alias: "Wingdings",
    },
  ],
]);

const fontAliases = new Map([["Arial-Black", "ArialBlack"]]);

function getStyleToAppend(style: Style_ | undefined) {
  switch (style) {
    case BOLD:
      return "Bold";
    case ITALIC:
      return "Italic";
    case BOLDITALIC:
      return "Bold Italic";
    default:
      if (style?.weight === "bold") {
        return "Bold";
      }
      if (style?.style === "italic") {
        return "Italic";
      }
  }
  return "";
}

type GenerateFontR_ = {
  style?: Style_;
  ultimate?: Ultimate_ | undefined;
};

/**
 * Generate font description.
 * @param param0 font substitution description.
 * @param src contains src values (local(...) or url(...)).
 * @param localFontPath, path to local fonts.
 * @param useFallback, whether to use fallback font.
 * @param usePath, whether to use path to font.
 * @param append, style (Bold, Italic, ...) to append to font name.
 */
function generateFont(
  { alias, local, path, fallback, style, ultimate }: Substitution_,
  src: string[],
  localFontPath: string | undefined,
  useFallback = true,
  usePath = true,
  append = "",
): GenerateFontR_ {
  const result = {} as GenerateFontR_;
  if (local) {
    const extra = append ? ` ${append}` : "";
    for (const name of local) {
      src.push(`local(${name}${extra})`);
    }
  }
  if (alias) {
    const substitution = substitutionMap.get(alias)!;
    const aliasAppend = append || getStyleToAppend(style);
    Object.assign(
      result,
      generateFont(
        substitution,
        src,
        localFontPath,
        /* useFallback = */ useFallback && !fallback,
        /* usePath = */ usePath && !path,
        aliasAppend,
      ),
    );
  }
  if (style) {
    result.style = style;
  }
  if (ultimate) {
    result.ultimate = ultimate;
  }
  if (useFallback && fallback) {
    const fallbackInfo = substitutionMap.get(fallback)!;
    const { ultimate: fallbackUltimate } = generateFont(
      fallbackInfo,
      src,
      localFontPath,
      useFallback,
      /* usePath = */ usePath && !path,
      append,
    );
    result.ultimate ||= fallbackUltimate;
  }
  if (usePath && path && localFontPath) {
    src.push(`url(${localFontPath}${path})`);
  }

  return result;
}

export type SubstitutionInfo = {
  css: string;
  guessFallback: boolean;
  loadedName: string;
  baseFontName: string;
  src: string;
  style: Style_ | undefined;
};

/**
 * Get a font substitution for a given font.
 * The general idea is to have enough information to create a CSS rule like
 * this:
 *   @font-face {
 *    font-family: 'Times';
 *    src: local('Times New Roman'), local('Subst1'), local('Subst2'),
 *         url(.../TimesNewRoman.ttf)
 *    font-weight: normal;
 *    font-style: normal;
 *   }
 * or use the FontFace API.
 *
 * @param systemFontCache The cache of local fonts.
 * @param idFactory The ids factory.
 * @param localFontPath Path to the fonts directory.
 * @param baseFontName The font name to be substituted.
 * @param standardFontName The standard font name to use
 *   if the base font is not available.
 * @return an Object with the CSS, the loaded name, the src and the style.
 */
export function getFontSubstitution(
  systemFontCache: Map<string, SubstitutionInfo>,
  idFactory: GlobalIdFactory,
  localFontPath: string | undefined,
  baseFontName: string,
  standardFontName: string | undefined,
): SubstitutionInfo | undefined {
  // It's possible to have a font name with spaces, commas or dashes, hence we
  // just replace them by a dash.
  baseFontName = normalizeFontName(baseFontName);

  const key = baseFontName;
  let substitutionInfo = systemFontCache.get(key);
  if (substitutionInfo) {
    return substitutionInfo;
  }

  // First, check if we've a substitution for the base font.
  let substitution = substitutionMap.get(baseFontName);
  if (!substitution) {
    // Check if we've an alias for the base font, Arial-Black is the same as
    // ArialBlack
    for (const [alias, subst] of fontAliases) {
      if (baseFontName.startsWith(alias)) {
        baseFontName = `${subst}${baseFontName.substring(alias.length)}`;
        substitution = substitutionMap.get(baseFontName);
        break;
      }
    }
  }

  let mustAddBaseFont = false;
  if (!substitution) {
    // If not, check if we've a substitution for the standard font.
    substitution = substitutionMap.get(standardFontName!);
    mustAddBaseFont = true;
  }

  const loadedName = `${idFactory.getDocId()}_s${idFactory.createFontId()}`;
  if (!substitution) {
    if (!validateFontName(baseFontName)) {
      // systemFontCache.set(key, null);
      systemFontCache.delete(key);
      // If the baseFontName is not valid we don't want to use it.
      return undefined;
    }
    // Maybe we'll be lucky and the OS will have the font.
    const bold = /bold/gi.test(baseFontName);
    const italic = /oblique|italic/gi.test(baseFontName);
    const style = (bold && italic && BOLDITALIC) ||
      (bold && BOLD) ||
      (italic && ITALIC) ||
      NORMAL;
    substitutionInfo = {
      css: loadedName,
      guessFallback: true,
      loadedName,
      baseFontName,
      src: `local(${baseFontName})`,
      style,
    };
    systemFontCache.set(key, substitutionInfo);
    return substitutionInfo;
  }

  const src = [];
  // Maybe the OS will have the exact font we want so just prepend it to the
  // list.
  if (mustAddBaseFont && validateFontName(baseFontName)) {
    src.push(`local(${baseFontName})`);
  }
  const { style, ultimate } = generateFont(substitution, src, localFontPath);
  const guessFallback = ultimate === null;
  const fallback = guessFallback ? "" : `,${ultimate}`;

  substitutionInfo = {
    css: `${loadedName}${fallback}`,
    guessFallback,
    loadedName,
    baseFontName,
    src: src.join(","),
    style,
  };
  systemFontCache.set(key, substitutionInfo);

  return substitutionInfo;
}
/*80--------------------------------------------------------------------------*/
