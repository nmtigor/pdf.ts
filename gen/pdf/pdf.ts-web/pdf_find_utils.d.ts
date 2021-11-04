export declare const enum CharacterType {
    SPACE = 0,
    ALPHA_LETTER = 1,
    PUNCT = 2,
    HAN_LETTER = 3,
    KATAKANA_LETTER = 4,
    HIRAGANA_LETTER = 5,
    HALFWIDTH_KATAKANA_LETTER = 6,
    THAI_LETTER = 7
}
/**
 * This function is based on the word-break detection implemented in:
 * https://hg.mozilla.org/mozilla-central/file/tip/intl/lwbrk/WordBreaker.cpp
 */
export declare function getCharacterType(charCode: number): CharacterType;
//# sourceMappingURL=pdf_find_utils.d.ts.map