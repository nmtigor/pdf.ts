export declare enum TOKEN {
    and = 0,
    divide = 1,
    dot = 2,
    dotDot = 3,
    dotHash = 4,
    dotStar = 5,
    eq = 6,
    ge = 7,
    gt = 8,
    le = 9,
    leftBracket = 10,
    leftParen = 11,
    lt = 12,
    minus = 13,
    ne = 14,
    not = 15,
    null = 16,
    number = 17,
    or = 18,
    plus = 19,
    rightBracket = 20,
    rightParen = 21,
    string = 22,
    this = 23,
    times = 24,
    identifier = 25,
    break = 26,
    continue = 27,
    do = 28,
    for = 29,
    foreach = 30,
    func = 31,
    if = 32,
    var = 33,
    while = 34,
    assign = 35,
    comma = 36,
    downto = 37,
    else = 38,
    elseif = 39,
    end = 40,
    endif = 41,
    endfor = 42,
    endfunc = 43,
    endwhile = 44,
    eof = 45,
    exit = 46,
    in = 47,
    infinity = 48,
    nan = 49,
    return = 50,
    step = 51,
    then = 52,
    throw = 53,
    upto = 54
}
export declare class Token {
    readonly id: TOKEN;
    readonly value: string | number | undefined;
    constructor(id: TOKEN, value?: number | string);
}
export declare class Lexer {
    data: string;
    pos: number;
    len: number;
    strBuf: string[];
    constructor(data: string);
    skipUntilEOL(): void;
    getIdentifier(): Token;
    getString(): Token;
    getNumber(first: number): Token;
    getCompOperator(alt1: Token, alt2: Token): Token;
    getLower(): Token;
    getSlash(): boolean;
    getDot(): Token;
    next(): Token;
}
//# sourceMappingURL=formcalc_lexer.d.ts.map