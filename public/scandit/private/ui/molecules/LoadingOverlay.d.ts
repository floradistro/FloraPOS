/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare const tag: "scandit-loading-overlay";
declare class LoadingOverlay extends ScanditHTMLElement {
    static readonly tag: "scandit-loading-overlay";
    private _progressBar;
    private _label;
    constructor();
    set progress(value: number | null);
    set message(message: string);
    get message(): string;
    static create(): LoadingOverlay;
    static register(): void;
    private static createStyleElement;
    connectedCallback(): void;
    show(): void;
    hide(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        [tag]: LoadingOverlay;
    }
}

export { LoadingOverlay };
