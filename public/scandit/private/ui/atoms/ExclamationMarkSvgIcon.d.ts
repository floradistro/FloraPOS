/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ExclamationMarkSvgIcon extends SvgIcon {
    static tag: "scandit-exclamation-mark-icon";
    static create(): ExclamationMarkSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ExclamationMarkSvgIcon.tag]: ExclamationMarkSvgIcon;
    }
}

export { ExclamationMarkSvgIcon };
