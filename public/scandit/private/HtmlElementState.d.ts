/// <reference types="emscripten" />
import { Serializable } from './Serializable.js';
import { SizeWithUnit } from '../Common.js';

interface HTMLElementStateJSON {
    size: SizeWithUnit;
    visible: boolean;
}
declare class HTMLElementState implements Serializable<HTMLElementStateJSON> {
    element: HTMLElement;
    private resizeObserver;
    private mutationObserver;
    private onStateChangedListener?;
    private onDisconnectedListener?;
    private cachedDOMRect;
    constructor(element: HTMLElement);
    get width(): number;
    get height(): number;
    static areEquivalentJSONStates(state1?: HTMLElementStateJSON, state2?: HTMLElementStateJSON): boolean;
    onStateChanged(callback: () => void): void;
    onDisconnected(callback: () => void): void;
    toJSONObject(): HTMLElementStateJSON;
    isSameAs(other: HTMLElementState): boolean;
    removeListeners(): void;
    private isVisible;
    private setupListeners;
    private onSizeChange;
    private onMutation;
    /**
     * cache DOMRect from ResizeObserver entries if available, else use getBoundingClientRect
     */
    private cacheDOMRect;
}

export { HTMLElementState, type HTMLElementStateJSON };
