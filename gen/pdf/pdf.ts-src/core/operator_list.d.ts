import { type StreamSink, Thread } from "../shared/message_handler.js";
import { OPS, RenderingIntentFlag } from "../shared/util.js";
import { MarkedContentProps, OpArgs } from "./evaluator.js";
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
        checkFn: CheckFn | undefined;
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
        push(fn: OPS, args?: OpArgs): void;
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
        argsArray: (OpArgs | undefined)[];
        length?: number;
        lastChunk: boolean | undefined;
        separateAnnots: {
            form: boolean;
            canvas: boolean;
        } | undefined;
    }
    /** @final */
    class OperatorList {
        #private;
        fnArray: OPS[];
        argsArray: (OpArgs | undefined)[];
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
        addOp(fn: OPS, args?: OpArgs): void;
        addImageOps(fn: OPS, args: OpArgs | undefined, optionalContent: MarkedContentProps | undefined): void;
        addDependency(dependency: string): void;
        addDependencies(dependencies: Set<string>): void;
        addOpList(opList: OperatorList): void;
        getIR(): OpListIR;
        get _transfers(): any[];
        flush(lastChunk?: boolean, separateAnnots?: {
            form: boolean;
            canvas: boolean;
        }): void;
    }
}
export import OperatorList = NsOperatorList.OperatorList;
export type OpListIR = NsOperatorList.OpListIR;
export {};
//# sourceMappingURL=operator_list.d.ts.map