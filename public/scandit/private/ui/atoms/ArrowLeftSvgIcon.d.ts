/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ArrowLeftSvgIcon extends SvgIcon {
    static tag: "scandit-arrow-left-icon";
    static create(): ArrowLeftSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ArrowLeftSvgIcon.tag]: ArrowLeftSvgIcon;
    }
}

export { ArrowLeftSvgIcon };
