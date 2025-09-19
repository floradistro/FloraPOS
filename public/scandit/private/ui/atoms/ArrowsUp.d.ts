/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare const tag = "scandit-arrows-up";
declare class ArrowsUp extends ScanditHTMLElement {
    static readonly tag: typeof tag;
    constructor();
    static createStyleElement(): HTMLStyleElement;
    static create(): ArrowsUp;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [tag]: ArrowsUp;
    }
}

export { ArrowsUp };
