/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ChevronLeftSvgIcon extends SvgIcon {
    static tag: "scandit-chevron-left-icon";
    static create(): ChevronLeftSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ChevronLeftSvgIcon.tag]: ChevronLeftSvgIcon;
    }
}

export { ChevronLeftSvgIcon };
