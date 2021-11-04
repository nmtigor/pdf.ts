import { Thread, StreamSink } from "../shared/message_handler.js";
import { OPS, RenderingIntentFlag } from "../shared/util.js";
declare namespace NsQueueOptimizer {
    interface QueueOptimizerContext {
        iCurr: number;
        fnArray: OPS[];
        argsArray: unknown[];
    }
    type CheckFn = (context: QueueOptimizerContext) => boolean;
    type IterateFn = (context: QueueOptimizerContext, i: number) => boolean;
    type ProcessFn = (context: QueueOptimizerContext, i: number) => number;
    interface Match {
        checkFn: CheckFn | null;
        iterateFn: IterateFn;
        processFn: ProcessFn;
    }
    type State = {
        [fn in OPS]: State | Match;
    };
    export class NullOptimizer {
        queue: OperatorList;
        constructor(queue: OperatorList);
        _optimize(): void;
        push(fn: OPS, args?: unknown[] | Uint8ClampedArray | null): void;
        flush(): void;
        reset(): void;
    }
    export class QueueOptimizer extends NullOptimizer {
        state: State | undefined;
        context: QueueOptimizerContext;
        match: Match | undefined;
        lastProcessed: number;
        constructor(queue: OperatorList);
        _optimize(): void;
        flush(): void;
        reset(): void;
    }
    export {};
}
import QueueOptimizer = NsQueueOptimizer.QueueOptimizer;
import NullOptimizer = NsQueueOptimizer.NullOptimizer;
declare namespace NsOperatorList {
    /**
     * PDF page operator list.
     */
    interface OpListIR {
        /**
         * Array containing the operator functions.
         */
        fnArray: OPS[];
        /**
         * Array containing the arguments of the functions.
         */
        argsArray: unknown[];
        length?: number;
        lastChunk: boolean | undefined;
    }
    /** @final */
    class OperatorList {
        #private;
        fnArray: OPS[];
        argsArray: (unknown[] | Uint8ClampedArray | null | undefined)[];
        get length(): number;
        optimizer: QueueOptimizer | NullOptimizer;
        dependencies: Set<string>;
        /**
         * @return The total length of the entire operator list, since
         *  `this.length === 0` after flushing.
         */
        get totalLength(): number;
        weight: number;
        constructor(intent?: RenderingIntentFlag, streamSink?: StreamSink<Thread.main, "GetOperatorList">);
        get ready(): Promise<void>;
        addOp(fn: OPS, args?: unknown[] | Uint8ClampedArray | null): void;
        addDependency(dependency: string): void;
        addDependencies(dependencies: Set<string>): void;
        addOpList(opList: OperatorList): void;
        getIR(): OpListIR;
        get _transfers(): any[];
        flush(lastChunk?: boolean): void;
    }
}
export import OperatorList = NsOperatorList.OperatorList;
export import OpListIR = NsOperatorList.OpListIR;
export {};
//# sourceMappingURL=operator_list.d.ts.map