/// <reference types="emscripten" />
import { Quadrilateral, QuadrilateralJSON, PointJSON, Point } from '../Common.js';
import { Serializable } from './Serializable.js';

interface AnchorPositionsJSON extends QuadrilateralJSON {
    centerRight: PointJSON;
    centerLeft: PointJSON;
    topCenter: PointJSON;
    bottomCenter: PointJSON;
    center: PointJSON;
}
declare class AnchorPositions extends Quadrilateral implements Serializable<AnchorPositionsJSON> {
    private readonly _centerRight;
    private readonly _centerLeft;
    private readonly _topCenter;
    private readonly _bottomCenter;
    private readonly _center;
    constructor(topLeft: Point, topRight: Point, bottomRight: Point, bottomLeft: Point, centerLeft: Point, topCenter: Point, centerRight: Point, bottomCenter: Point, center: Point);
    get centerRight(): Point;
    get center(): Point;
    get centerLeft(): Point;
    get topCenter(): Point;
    get bottomCenter(): Point;
    protected static fromJSON(json: AnchorPositionsJSON): AnchorPositions;
    toJSONObject(): AnchorPositionsJSON;
    /**
     * Orders vertices by their position, ensuring the top edge has the smallest Y midpoint.
     * The function is mainly used by the BarcodeArView to snap the annotation based on the barcode orientation
     * @returns {AnchorPositions} New AnchorPositions with ordered vertices
     */
    orderVerticesByPosition(): AnchorPositions;
    /**
     * Calculate the area of a quadrilateral using the shoelace formula (also known as the surveyor's formula).
     * The formula works by taking pairs of x and y coordinates and computing:
     * (x1*y2 + x2*y3 + x3*y4 + x4*y1) - (y1*x2 + y2*x3 + y3*x4 + y4*x1)
     * Then takes the absolute value and divides by 2 to get the area.
     */
    private getArea;
}

export { AnchorPositions, type AnchorPositionsJSON };
