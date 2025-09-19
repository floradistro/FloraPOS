/// <reference types="emscripten" />
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';

declare const VARIANTS: {
    readonly default: "default";
    readonly play: "play";
    readonly pause: "pause";
};
type Variant<T = typeof VARIANTS> = T[keyof T];
declare class ShutterButton extends ScanditHTMLElement {
    static readonly tag: "scandit-shutter-button";
    private _button;
    private _mainSVGCircle;
    shadowRoot: ShadowRoot;
    constructor();
    static get observedAttributes(): string[];
    set variant(newState: Variant);
    get variant(): Variant;
    set pulse(pulse: boolean);
    get pulse(): boolean;
    set rotating(rotating: boolean);
    get rotating(): boolean;
    static register(): void;
    static create(): ShutterButton;
    /**
     * Only handle side effect of attribute changes here, or you may create a loop.
     * See https://web.dev/articles/custom-elements-best-practices#avoid_reentrancy_issues
     */
    attributeChangedCallback(name: string): void;
    private checkVariant;
    private refreshButtonWidth;
    private connectedCallback;
    private isValidState;
    private appendStyle;
}
declare global {
    interface HTMLElementTagNameMap {
        [ShutterButton.tag]: ShutterButton;
    }
}

export { ShutterButton, VARIANTS, type Variant };
