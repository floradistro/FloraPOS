/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class HandLensCheckSvgIcon extends SvgIcon {
    static tag: "scandit-hand-lens-check-icon";
    static create(): HandLensCheckSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [HandLensCheckSvgIcon.tag]: HandLensCheckSvgIcon;
    }
}

export { HandLensCheckSvgIcon };
