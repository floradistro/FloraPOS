/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class CrossSvgIcon extends SvgIcon {
    static tag: "scandit-cross-icon";
    static create(): CrossSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [CrossSvgIcon.tag]: CrossSvgIcon;
    }
}

export { CrossSvgIcon };
