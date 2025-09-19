/// <reference types="emscripten" />
import { Color, SizeWithUnitAndAspect, NumberWithUnit, SizeWithUnit } from './Common.js';
import { Viewfinder } from './Viewfinder.js';
import { RectangularViewfinderJSON, RectangularViewfinderStyle, RectangularViewfinderLineStyle, RectangularViewfinderAnimation } from './ViewfinderPlusRelated.js';
import { Serializable } from './private/Serializable.js';
import './private/nativeHandle.js';

declare class RectangularViewfinder implements Viewfinder, Serializable<RectangularViewfinderJSON> {
    color: Color;
    private readonly _lineStyle;
    private readonly _style;
    private readonly type;
    private _animation;
    private _dimming;
    private _sizeWithUnitAndAspect;
    private _disabledColor;
    constructor(style?: RectangularViewfinderStyle, lineStyle?: RectangularViewfinderLineStyle);
    get animation(): RectangularViewfinderAnimation | null;
    set animation(animation: RectangularViewfinderAnimation | null);
    get dimming(): number;
    set dimming(value: number);
    get lineStyle(): RectangularViewfinderLineStyle;
    get sizeWithUnitAndAspect(): SizeWithUnitAndAspect;
    get style(): RectangularViewfinderStyle;
    get disabledColor(): Color;
    set disabledColor(disabledColor: Color);
    setHeightAndAspectRatio(height: NumberWithUnit, widthToHeightAspectRatio: number): void;
    setShorterDimensionAndAspectRatio(fraction: number, aspectRatio: number): void;
    setSize(size: SizeWithUnit): void;
    setWidthAndAspectRatio(width: NumberWithUnit, heightToWidthAspectRatio: number): void;
    toJSONObject(): RectangularViewfinderJSON;
}

export { RectangularViewfinder };
