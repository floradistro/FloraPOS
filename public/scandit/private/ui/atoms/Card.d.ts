/// <reference types="emscripten" />
import { Color } from '../../../Common.js';
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';
import '../../Serializable.js';

declare class Card extends ScanditHTMLElement {
    static tag: "scandit-basic-card";
    constructor();
    set haloGlow(active: boolean);
    get haloGlow(): boolean;
    set backgroundColor(color: Color);
    get backgroundColor(): Color;
    set borderColor(color: Color);
    get borderColor(): Color;
    static create(): Card;
    static register(): void;
    private static createStyleElement;
}
declare global {
    interface HTMLElementTagNameMap {
        [Card.tag]: Card;
    }
}

export { Card };
