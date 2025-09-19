/// <reference types="emscripten" />
import { Orientation } from '../Common.js';
import './Serializable.js';

declare const orientationChangeEvent = "orientationchange";
interface OrientationEventValue {
    type: OrientationType;
    angle: number;
    value: Orientation;
}
declare class OrientationObserver extends EventTarget {
    orientation: OrientationEventValue;
    private landscapeOrientationMediaQuery;
    private screenOrientationChangeListener;
    private landscapeOrientationMediaQueryChangeListener;
    register(): void;
    unregister(): void;
    isScreenOrientationApiSupported(): boolean;
    dispatchOrientationChangeEvent(orientation: OrientationEventValue): void;
    onScreenOrientationChange(): void;
    onLandscapeOrientationMediaQueryChange(event: Event): void;
}
type OrientationChangeEvent = CustomEvent<OrientationEventValue>;
declare global {
    interface HTMLElementEventMap {
        [orientationChangeEvent]: OrientationChangeEvent;
    }
}

export { type OrientationChangeEvent, type OrientationEventValue, OrientationObserver, orientationChangeEvent };
