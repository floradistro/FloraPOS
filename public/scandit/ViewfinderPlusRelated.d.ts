/// <reference types="emscripten" />
import { ColorJSON, NumberWithUnit, Color, SizeWithUnitAndAspect, NumberWithUnitJSON, SizeWithUnitAndAspectJSON } from './Common.js';
import { Serializable } from './private/Serializable.js';

type ViewfinderTypeNone = "none";
type ViewfinderTypeLaserLine = "laserline";
type ViewfinderTypeRectangular = "rectangular";
type ViewfinderTypeAimer = "aimer";
type ViewfinderTypeTargetAimer = "targetAimer";
type ViewfinderType = ViewfinderTypeAimer | ViewfinderTypeNone | ViewfinderTypeLaserLine | ViewfinderTypeRectangular | ViewfinderTypeTargetAimer;
interface ViewfinderJSON {
    type: ViewfinderType;
}
declare enum RectangularViewfinderStyle {
    Rounded = "rounded",
    Square = "square"
}
interface PrivateLaserlineViewfinderDefault {
    width: NumberWithUnit;
    enabledColor: Color;
    disabledColor: Color;
}
interface LaserlineViewfinderJSON extends ViewfinderJSON {
    type: ViewfinderTypeLaserLine;
    width: NumberWithUnitJSON;
    enabledColor: ColorJSON;
    disabledColor: ColorJSON;
}
declare enum RectangularViewfinderLineStyle {
    Light = "light",
    Bold = "bold"
}
interface PrivateRectangularViewfinderDefault {
    color: Color;
    style: RectangularViewfinderStyle;
    lineStyle: RectangularViewfinderLineStyle;
    dimming: number;
    animation: RectangularViewfinderAnimation | null;
    size: SizeWithUnitAndAspect;
}
interface RectangularViewfinderJSON extends ViewfinderJSON {
    type: ViewfinderTypeRectangular;
    color: ColorJSON;
    style: string;
    lineStyle: string;
    dimming: number;
    animation: RectangularViewfinderAnimationJSON | null;
    size: SizeWithUnitAndAspectJSON;
    disabledColor: ColorJSON;
}
interface RectangularViewfinderAnimationJSON {
    readonly looping: boolean;
}
interface AimerViewfinderJSON extends ViewfinderJSON {
    type: ViewfinderTypeAimer;
    frameColor: ColorJSON;
    dotColor: ColorJSON;
}
interface PrivateRectangularViewfinderAnimation {
    fromJSON: (json: RectangularViewfinderAnimationJSON) => RectangularViewfinderAnimation;
}
declare class RectangularViewfinderAnimation implements Serializable<RectangularViewfinderAnimationJSON> {
    private readonly _isLooping;
    constructor(isLooping: boolean);
    get isLooping(): boolean;
    private static fromJSON;
    toJSONObject(): RectangularViewfinderAnimationJSON;
}

export { type AimerViewfinderJSON, type LaserlineViewfinderJSON, type PrivateLaserlineViewfinderDefault, type PrivateRectangularViewfinderAnimation, type PrivateRectangularViewfinderDefault, RectangularViewfinderAnimation, type RectangularViewfinderJSON, RectangularViewfinderLineStyle, RectangularViewfinderStyle, type ViewfinderJSON, type ViewfinderType, type ViewfinderTypeAimer, type ViewfinderTypeLaserLine, type ViewfinderTypeNone, type ViewfinderTypeRectangular, type ViewfinderTypeTargetAimer };
