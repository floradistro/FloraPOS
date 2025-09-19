/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class CheckSvgIcon extends SvgIcon {
    static tag: "scandit-check-icon";
    static create(): CheckSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [CheckSvgIcon.tag]: CheckSvgIcon;
    }
}

export { CheckSvgIcon };
