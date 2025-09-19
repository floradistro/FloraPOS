/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ArrowRightSvgIcon extends SvgIcon {
    static tag: "scandit-arrow-right-icon";
    static create(): ArrowRightSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ArrowRightSvgIcon.tag]: ArrowRightSvgIcon;
    }
}

export { ArrowRightSvgIcon };
