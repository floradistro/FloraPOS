/// <reference types="emscripten" />
import EventManager from '../EventManager.js';
import { Point } from '../../Common.js';
import '../Serializable.js';

interface GestureRecognizerListener {
    onTap?(point: Point, event: Event): void;
}
declare class GestureRecognizer extends EventManager<GestureRecognizerListener> {
    protected element: HTMLElement;
    private readonly _onTouchStart;
    private readonly _onPointerDown;
    constructor(element: HTMLElement);
    removeAllListeners(): void;
    private addPointerDownListener;
    private onPointerDown;
    private onTouchStart;
    private pointRelativeToElement;
    private onTap;
}

export { GestureRecognizer, type GestureRecognizerListener };
