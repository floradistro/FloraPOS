/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class RoundedCrossSvgIcon extends SvgIcon {
    static tag: "scandit-rounded-cross-icon";
    static create(): RoundedCrossSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [RoundedCrossSvgIcon.tag]: RoundedCrossSvgIcon;
    }
}

export { RoundedCrossSvgIcon };
