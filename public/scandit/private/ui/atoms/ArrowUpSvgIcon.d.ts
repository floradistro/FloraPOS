/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ArrowUpSvgIcon extends SvgIcon {
    static tag: "scandit-arrow-up-icon";
    static create(): ArrowUpSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ArrowUpSvgIcon.tag]: ArrowUpSvgIcon;
    }
}

export { ArrowUpSvgIcon };
