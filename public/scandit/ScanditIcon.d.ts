/// <reference types="emscripten" />
import { Color } from './Common.js';
import { ScanditHTMLElement } from './private/utils/ScanditHTMLElement.js';
import './private/Serializable.js';

declare enum ScanditIconShape {
    Circle = "circle",
    Square = "square"
}
declare class ScanditIcon extends ScanditHTMLElement {
    static tag: "scandit-barcode-icon-container";
    private static readonly observedAttributes;
    private containerElement;
    private onSlotChangeListener;
    constructor();
    get iconColor(): Color;
    protected set iconColor(value: Color);
    get backgroundColor(): Color;
    protected set backgroundColor(color: Color);
    get backgroundStrokeColor(): Color;
    protected set backgroundStrokeColor(color: Color);
    get backgroundStrokeWidth(): number;
    protected set backgroundStrokeWidth(value: number);
    get backgroundShape(): ScanditIconShape | null;
    protected set backgroundShape(value: ScanditIconShape | null);
    protected set width(width: number);
    protected get width(): number;
    protected set height(height: number);
    protected get height(): number;
    static create(): ScanditIcon;
    private static register;
    private static createStyleElement;
    private onSlotChange;
    connectedCallback(): void;
    disconnectedCallback(): void;
    private render;
    private attributeChangedCallback;
    private getStylePropertyValue;
    private setStylePropertyValue;
    private updateIconSizeProperty;
    private setIconSize;
    private updateFillIconColor;
}
declare global {
    interface HTMLElementTagNameMap {
        [ScanditIcon.tag]: ScanditIcon;
    }
}

export { ScanditIcon, ScanditIconShape };
