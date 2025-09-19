/// <reference types="emscripten" />
import { NumberWithUnitJSON, NumberWithUnit, SizeWithUnitAndAspectJSON, SizeWithUnitAndAspect, SizeWithUnit } from './Common.js';
import { Serializable } from './private/Serializable.js';

interface LocationSelectionJSON {
    type: string;
}
interface LocationSelection extends Serializable<LocationSelectionJSON> {
    toJSONObject: () => any;
}
declare const PrivateNoneLocationSelection: {
    type: string;
};
interface RadiusLocationSelectionJSON {
    type: "radius";
    radius: NumberWithUnitJSON;
}
interface RectangularLocationSelectionJSON {
    type: "rectangular";
    size: SizeWithUnitAndAspectJSON;
}
declare class RadiusLocationSelection implements LocationSelection, Serializable<RadiusLocationSelectionJSON> {
    private readonly type;
    private readonly _radius;
    get radius(): NumberWithUnit;
    constructor(radius: NumberWithUnit);
    toJSONObject(): RadiusLocationSelectionJSON;
}
declare class RectangularLocationSelection implements LocationSelection, Serializable<RectangularLocationSelectionJSON> {
    private readonly type;
    private _sizeWithUnitAndAspect;
    get sizeWithUnitAndAspect(): SizeWithUnitAndAspect;
    static withSize(size: SizeWithUnit): RectangularLocationSelection;
    static withWidthAndAspectRatio(width: NumberWithUnit, heightToWidthAspectRatio: number): RectangularLocationSelection;
    static withHeightAndAspectRatio(height: NumberWithUnit, widthToHeightAspectRatio: number): RectangularLocationSelection;
    toJSONObject(): RectangularLocationSelectionJSON;
}

export { type LocationSelection, type LocationSelectionJSON, PrivateNoneLocationSelection, RadiusLocationSelection, RectangularLocationSelection };
