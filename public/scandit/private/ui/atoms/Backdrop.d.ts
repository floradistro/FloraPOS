/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare class Backdrop extends ScanditHTMLElement {
    static tag: "scandit-backdrop";
    private fadeInAnimation?;
    private fadeOutAnimation?;
    private readonly fadeInKeyframes;
    private readonly fadeOutKeyframes;
    private readonly animationOptions;
    constructor();
    static get observedAttributes(): string[];
    get open(): boolean;
    set open(value: boolean);
    static create(): Backdrop;
    protected static register(): void;
    private static createStyleElement;
    attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void;
    show(): Promise<void>;
    hide(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        [Backdrop.tag]: Backdrop;
    }
}

export { Backdrop };
