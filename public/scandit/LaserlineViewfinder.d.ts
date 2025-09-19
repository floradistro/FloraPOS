/// <reference types="emscripten" />
import { NumberWithUnit, Color } from './Common.js';
import { Viewfinder } from './Viewfinder.js';
import { LaserlineViewfinderJSON } from './ViewfinderPlusRelated.js';
import { Serializable } from './private/Serializable.js';
import './private/nativeHandle.js';

declare class LaserlineViewfinder implements Viewfinder, Serializable<LaserlineViewfinderJSON> {
    width: NumberWithUnit;
    enabledColor: Color;
    disabledColor: Color;
    private readonly type;
    constructor();
    toJSONObject(): LaserlineViewfinderJSON;
}

export { LaserlineViewfinder };
