/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ChevronDownSvgIcon extends SvgIcon {
    static tag: "scandit-chevron-down-icon";
    static create(): ChevronDownSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ChevronDownSvgIcon.tag]: ChevronDownSvgIcon;
    }
}

export { ChevronDownSvgIcon };
