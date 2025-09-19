/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare const tag: "scandit-progress-bar";
declare class ProgressBar extends ScanditHTMLElement {
    static readonly tag: "scandit-progress-bar";
    private progress;
    constructor();
    private static get observedAttributes();
    private static createStyleElement;
    get min(): number;
    get max(): number;
    set max(value: number | null);
    get value(): number | null;
    set value(value: number | null | undefined);
    static create(): ProgressBar;
    static register(): void;
    protected attributeChangedCallback(): void;
    protected connectedCallback(): void;
    private update;
}
declare global {
    interface HTMLElementTagNameMap {
        [tag]: ProgressBar;
    }
}

export { ProgressBar };
