import type { ComplexPattern } from "./ast.js";
import type { FluentBundle, FluentVariable } from "./bundle.js";
export declare class Scope {
    /** The bundle for which the given resolution is happening. */
    bundle: FluentBundle;
    /** The list of errors collected while resolving. */
    errors: Error[] | undefined;
    /** A dict of developer-provided variables. */
    args: Record<string, FluentVariable> | undefined;
    /**
     * The Set of patterns already encountered during this resolution.
     * Used to detect and prevent cyclic resolutions.
     * @ignore
     */
    dirty: WeakSet<ComplexPattern>;
    /** A dict of parameters passed to a TermReference. */
    params: Record<string, FluentVariable> | undefined;
    /**
     * The running count of placeables resolved so far.
     * Used to detect the Billion Laughs and Quadratic Blowup attacks.
     * @ignore
     */
    placeables: number;
    constructor(bundle: FluentBundle, errors?: Error[], args?: Record<string, FluentVariable>);
    reportError(error?: unknown): void;
    memoizeIntlObject(ctor: typeof Intl.NumberFormat | typeof Intl.DateTimeFormat | typeof Intl.PluralRules, opts?: Intl.NumberFormatOptions | Intl.DateTimeFormatOptions | Intl.PluralRulesOptions): Intl.NumberFormat | Intl.DateTimeFormat | Intl.PluralRules;
}
//# sourceMappingURL=scope.d.ts.map