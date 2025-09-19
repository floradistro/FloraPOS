/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class RoundedExclamationMarkSvgIcon extends SvgIcon {
    static tag: "scandit-rounded-exclamation-mark-icon";
    static create(): RoundedExclamationMarkSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [RoundedExclamationMarkSvgIcon.tag]: RoundedExclamationMarkSvgIcon;
    }
}

export { RoundedExclamationMarkSvgIcon };
