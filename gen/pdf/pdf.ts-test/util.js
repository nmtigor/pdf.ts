/** 80**************************************************************************
 * @module pdf/pdf.ts-test/util
 * @license Apache-2.0
 ******************************************************************************/
/*80--------------------------------------------------------------------------*/
/**
 * `tasks` could be modified IN PLACE, although remaining elements themselves
 * will be kept intact.
 * @const @param filter
 */
export const filter_tasks = (tasks, filter) => {
    const { only, skip, limit, xfaOnly } = filter;
    if (only.length || skip.length || xfaOnly) {
        if (only.length)
            console.log("only: ", only);
        if (skip.length)
            console.log("skip: ", skip);
        tasks = tasks.filter((item) => {
            if ((!only.length || only.includes(item.id)) &&
                (!xfaOnly || item.enableXfa) &&
                !skip.includes(item.id)) {
                return true;
            }
            return false;
        });
    }
    if (limit) {
        console.log("limit: ", limit);
        if (limit < tasks.length) {
            tasks.length = limit;
        }
    }
    return tasks;
};
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=util.js.map