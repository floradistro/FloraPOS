/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';

declare enum LogoStyle {
    Minimal = "minimal",
    Extended = "extended"
}
interface FocusGestureJSON {
    type: string;
}
type FocusGesture = Serializable<FocusGestureJSON>;
declare class TapToFocus implements FocusGesture, Serializable<FocusGestureJSON> {
    private type;
    toJSONObject(): FocusGestureJSON;
}
type ZoomGesture = Serializable<ZoomGestureJSON>;
interface ZoomGestureJSON {
    type: string;
}
declare class SwipeToZoom implements ZoomGesture, Serializable<ZoomGestureJSON> {
    private readonly type;
    toJSONObject(): ZoomGestureJSON;
}

export { type FocusGesture, type FocusGestureJSON, LogoStyle, SwipeToZoom, TapToFocus, type ZoomGesture, type ZoomGestureJSON };
