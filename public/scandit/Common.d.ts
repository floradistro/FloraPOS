/// <reference types="emscripten" />
import { StringSerializable, Serializable } from './private/Serializable.js';

interface PointJSON {
    x: number;
    y: number;
}
declare class Point implements Serializable<PointJSON> {
    private readonly _x;
    private readonly _y;
    constructor(x: number, y: number);
    get x(): number;
    get y(): number;
    private static mirrorX;
    private static fromJSON;
    toJSONObject(): PointJSON;
    private static areEquals;
    private equals;
}
interface QuadrilateralJSON {
    topLeft: PointJSON;
    topRight: PointJSON;
    bottomRight: PointJSON;
    bottomLeft: PointJSON;
}
declare class Quadrilateral implements Serializable<QuadrilateralJSON> {
    private readonly _topLeft;
    private readonly _topRight;
    private readonly _bottomRight;
    private readonly _bottomLeft;
    constructor(topLeft: Point, topRight: Point, bottomRight: Point, bottomLeft: Point);
    get topLeft(): Point;
    get topRight(): Point;
    get bottomRight(): Point;
    get bottomLeft(): Point;
    protected static fromJSON(json: QuadrilateralJSON): Quadrilateral;
    toJSONObject(): QuadrilateralJSON;
}
declare enum MeasureUnit {
    Pixel = "pixel",
    Fraction = "fraction"
}
interface NumberWithUnitJSON {
    value: number;
    unit: string;
}
declare class NumberWithUnit implements Serializable<NumberWithUnitJSON> {
    private readonly _value;
    private readonly _unit;
    constructor(value: number, unit: MeasureUnit);
    get value(): number;
    get unit(): MeasureUnit;
    private static fromJSON;
    toJSONObject(): NumberWithUnitJSON;
}
interface PointWithUnitJSON {
    x: NumberWithUnitJSON;
    y: NumberWithUnitJSON;
}
declare class PointWithUnit implements Serializable<PointWithUnitJSON> {
    private readonly _x;
    private readonly _y;
    constructor(x: NumberWithUnit, y: NumberWithUnit);
    private static get zero();
    get x(): NumberWithUnit;
    get y(): NumberWithUnit;
    private static fromJSON;
    toJSONObject(): PointWithUnitJSON;
}
interface RectJSON {
    origin: PointJSON;
    size: SizeJSON;
}
declare class Rect implements Serializable<RectJSON> {
    private readonly _origin;
    private readonly _size;
    constructor(origin: Point, size: Size);
    get origin(): Point;
    get size(): Size;
    toJSONObject(): RectJSON;
}
interface RectWithUnitJSON {
    origin: PointWithUnitJSON;
    size: SizeWithUnitJSON;
}
declare class RectWithUnit implements Serializable<RectWithUnitJSON> {
    private readonly _origin;
    private readonly _size;
    constructor(origin: PointWithUnit, size: SizeWithUnit);
    get origin(): PointWithUnit;
    get size(): SizeWithUnit;
    toJSONObject(): RectWithUnitJSON;
}
interface SizeWithUnitJSON {
    width: NumberWithUnitJSON;
    height: NumberWithUnitJSON;
}
declare class SizeWithUnit implements Serializable<SizeWithUnitJSON> {
    private readonly _width;
    private readonly _height;
    constructor(width: NumberWithUnit, height: NumberWithUnit);
    get width(): NumberWithUnit;
    get height(): NumberWithUnit;
    private static fromJSON;
    isSameAs(other: SizeWithUnit): boolean;
    toJSONObject(): SizeWithUnitJSON;
}
interface SizeJSON {
    width: number;
    height: number;
}
declare class Size implements Serializable<SizeJSON> {
    private readonly _width;
    private readonly _height;
    constructor(width: number, height: number);
    get width(): number;
    get height(): number;
    private static fromJSON;
    toJSONObject(): SizeJSON;
}
declare class SizeWithAspect {
    private readonly _size;
    private readonly _aspect;
    constructor(size: NumberWithUnit, aspect: number);
    get size(): NumberWithUnit;
    get aspect(): number;
}
declare enum SizingMode {
    WidthAndHeight = "widthAndHeight",
    WidthAndAspectRatio = "widthAndAspectRatio",
    HeightAndAspectRatio = "heightAndAspectRatio",
    ShorterDimensionAndAspectRatio = "shorterDimensionAndAspectRatio"
}
interface SizeWithUnitAndAspectJSON {
    width?: NumberWithUnitJSON;
    height?: NumberWithUnitJSON;
    shorterDimension?: NumberWithUnitJSON;
    aspect?: number;
}
declare class SizeWithUnitAndAspect implements Serializable<SizeWithUnitAndAspectJSON> {
    private _widthAndHeight;
    private _widthAndAspectRatio;
    private _heightAndAspectRatio;
    private _shorterDimensionAndAspectRatio;
    get widthAndHeight(): SizeWithUnit | null;
    get widthAndAspectRatio(): SizeWithAspect | null;
    get heightAndAspectRatio(): SizeWithAspect | null;
    get shorterDimensionAndAspectRatio(): SizeWithAspect | null;
    get sizingMode(): SizingMode;
    private static sizeWithWidthAndHeight;
    private static sizeWithWidthAndAspectRatio;
    private static sizeWithHeightAndAspectRatio;
    private static sizeWithShorterDimensionAndAspectRatio;
    private static fromJSON;
    toJSONObject(): SizeWithUnitAndAspectJSON;
}
interface MarginsWithUnitJSON {
    left: NumberWithUnitJSON;
    right: NumberWithUnitJSON;
    top: NumberWithUnitJSON;
    bottom: NumberWithUnitJSON;
}
declare class MarginsWithUnit implements Serializable<MarginsWithUnitJSON> {
    private readonly _left;
    private readonly _right;
    private readonly _top;
    private readonly _bottom;
    constructor(left: NumberWithUnit, top: NumberWithUnit, right: NumberWithUnit, bottom: NumberWithUnit);
    private static get zero();
    get left(): NumberWithUnit;
    get right(): NumberWithUnit;
    get top(): NumberWithUnit;
    get bottom(): NumberWithUnit;
    private static fromJSON;
    toJSONObject(): MarginsWithUnitJSON;
}
type ColorJSON = string;
declare class Color implements StringSerializable {
    private readonly hexadecimalString;
    private constructor();
    get redComponent(): string;
    get greenComponent(): string;
    get blueComponent(): string;
    get alphaComponent(): string;
    get red(): number;
    get green(): number;
    get blue(): number;
    get alpha(): number;
    static fromHex(hex: string): Color;
    static fromRGBA(red: number, green: number, blue: number, alpha?: number): Color;
    private static areEquals;
    private static hexToNumber;
    private static fromJSON;
    private static numberToHex;
    private static normalizeHex;
    private static normalizeAlpha;
    withAlpha(alpha: number): Color;
    toJSON(): string;
}
declare enum Orientation {
    Unknown = "unknown",
    Portrait = "portrait",
    PortraitUpsideDown = "portraitUpsideDown",
    LandscapeRight = "landscapeRight",
    LandscapeLeft = "landscapeLeft"
}
declare enum Direction {
    None = "none",
    Horizontal = "horizontal",
    LeftToRight = "leftToRight",
    RightToLeft = "rightToLeft",
    Vertical = "vertical",
    TopToBottom = "topToBottom",
    BottomToTop = "bottomToTop"
}
declare enum Anchor {
    TopLeft = "topLeft",
    TopCenter = "topCenter",
    TopRight = "topRight",
    CenterLeft = "centerLeft",
    Center = "center",
    CenterRight = "centerRight",
    BottomLeft = "bottomLeft",
    BottomCenter = "bottomCenter",
    BottomRight = "bottomRight"
}
interface JSONType {
    [key: string]: JSONType | JSONType[] | boolean | number | string | null;
}

export { Anchor, Color, type ColorJSON, Direction, type JSONType, MarginsWithUnit, type MarginsWithUnitJSON, MeasureUnit, NumberWithUnit, type NumberWithUnitJSON, Orientation, Point, type PointJSON, PointWithUnit, type PointWithUnitJSON, Quadrilateral, type QuadrilateralJSON, Rect, type RectJSON, RectWithUnit, type RectWithUnitJSON, Size, type SizeJSON, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, type SizeWithUnitAndAspectJSON, type SizeWithUnitJSON, SizingMode };
