/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';

declare enum VibrationType {
    default = "default"
}
interface VibrationJSON {
    type: VibrationType;
}
declare class Vibration implements Serializable<VibrationJSON> {
    private readonly type;
    private readonly pattern;
    private readonly _vibrate;
    private constructor();
    static get defaultVibration(): Vibration;
    private static withPattern;
    toJSONObject(): VibrationJSON;
    private vibrate;
}

export { Vibration, type VibrationJSON };
