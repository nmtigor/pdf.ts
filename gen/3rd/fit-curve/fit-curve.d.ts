/**
 *  @preserve  JavaScript implementation of
 *  Algorithm for Automatically Fitting Digitized Curves
 *  by Philip J. Schneider
 *  "Graphics Gems", Academic Press, 1990
 *
 *  The MIT License (MIT)
 *
 *  https://github.com/soswow/fit-curves
 */
/** A point in space represented as an array of numbers, 2D by default, but can be any dimension. */
declare type Point<Arr extends number[]> = Arr;
/** A vector represented as an array of numbers, 2D by default, but can be any dimension. */
declare type Vector<Arr extends number[]> = Arr;
/** A Bezier curve represented by an array of points with elements [first-point, control-point-1, control-point-2, second-point] */
declare type Curve<Arr extends number[]> = [
    Point<Arr>,
    Point<Arr>,
    Point<Arr>,
    Point<Arr>
];
interface _ProgressCallback<Arr extends number[]> {
    bez: Curve<Arr>;
    points: Point<Arr>[];
    params: number[];
    maxErr: number;
    maxPoint: Number;
}
/**
 * Fit one or more Bezier curves to a set of points.
 *
 * @param points Array of digitized points, e.g. [[5,5],[5,50],[110,140],[210,160],[320,110]]
 * @param maxError Tolerance, squared error between points and fitted curve
 * @return Array of Bezier curves, where each element is [first-point, control-point-1, control-point-2, second-point] and points are [x, y]
 */
export declare function fitCurve<Arr extends number[] = [number, number]>(points: Point<Arr>[], maxError: number, progressCallback?: (_: _ProgressCallback<Arr>) => void): Curve<Arr>[];
/**
 * Fit a Bezier curve to a (sub)set of digitized points.
 * Your code should not call this function directly. Use {@link fitCurve} instead.
 *
 * @param points Array of digitized points, e.g. [[5,5],[5,50],[110,140],[210,160],[320,110]]
 * @param leftTangent Unit tangent vector at start point
 * @param rightTangent Unit tangent vector at end point
 * @param error Tolerance, squared error between points and fitted curve
 * @return Array of Bezier curves, where each element is [first-point, control-point-1, control-point-2, second-point] and points are [x, y]
 */
export declare function fitCubic<Arr extends number[] = [number, number]>(points: Point<Arr>[], leftTangent: Vector<Arr>, rightTangent: Vector<Arr>, error: number, progressCallback?: (_: _ProgressCallback<Arr>) => void): Curve<Arr>[];
/**
 * Creates a vector of length 1 which shows the direction from B to A
 */
export declare function createTangent<Arr extends number[] = [number, number]>(pointA: Point<Arr>, pointB: Point<Arr>): Vector<Arr>;
export {};
//# sourceMappingURL=fit-curve.d.ts.map