/* Converted from JavaScript to TypeScript by
 * nmtigor (https://github.com/nmtigor) @2022
 */
/*80--------------------------------------------------------------------------*/
export const FieldType = {
    none: 0,
    number: 1,
    percent: 2,
    date: 3,
    time: 4,
};
export function createActionsMap(actions) {
    const actionsMap = new Map();
    if (actions) {
        for (const [eventType, actionsForEvent] of Object.entries(actions)) {
            actionsMap.set(eventType, actionsForEvent);
        }
    }
    return actionsMap;
}
export function getFieldType(actions) {
    let format = actions.get("Format");
    if (!format) {
        return FieldType.none;
    }
    let format_ = format[0];
    format_ = format_.trim();
    if (format_.startsWith("AFNumber_"))
        return FieldType.number;
    if (format_.startsWith("AFPercent_"))
        return FieldType.percent;
    if (format_.startsWith("AFDate_"))
        return FieldType.date;
    if (format_.startsWith("AFTime__"))
        return FieldType.time;
    return FieldType.none;
}
/*80--------------------------------------------------------------------------*/
//# sourceMappingURL=common.js.map