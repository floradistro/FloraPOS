/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare const inlineStyleAttribute = "inline-style";
declare class SvgIcon extends ScanditHTMLElement {
    static readonly tag: string;
    private static readonly observedAttributes;
    get fill(): string;
    set fill(fill: string);
    get size(): number;
    set size(size: number);
    get [inlineStyleAttribute](): string | null;
    set [inlineStyleAttribute](inlineStyle: string | null);
    static create(): SvgIcon;
    protected render(): string;
    protected heightForViewbox(width: number, height: number): number;
    private aspectRatioForViewbox;
    private connectedCallback;
    private attributeChangedCallback;
}

export { SvgIcon };
