/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ChevronRightSvgIcon extends SvgIcon {
    static tag: "scandit-chevron-right-icon";
    static create(): ChevronRightSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ChevronRightSvgIcon.tag]: ChevronRightSvgIcon;
    }
}

export { ChevronRightSvgIcon };
