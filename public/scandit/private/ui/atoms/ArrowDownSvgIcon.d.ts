/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ArrowDownSvgIcon extends SvgIcon {
    static tag: "scandit-arrow-down-icon";
    static create(): ArrowDownSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ArrowDownSvgIcon.tag]: ArrowDownSvgIcon;
    }
}

export { ArrowDownSvgIcon };
