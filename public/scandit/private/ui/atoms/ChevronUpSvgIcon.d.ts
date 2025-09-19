/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ChevronUpSvgIcon extends SvgIcon {
    static tag: "scandit-chevron-up-icon";
    static create(): ChevronUpSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ChevronUpSvgIcon.tag]: ChevronUpSvgIcon;
    }
}

export { ChevronUpSvgIcon };
