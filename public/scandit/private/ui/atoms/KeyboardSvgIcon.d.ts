/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class KeyboardSvgIcon extends SvgIcon {
    static tag: "scandit-keyboard-icon";
    static create(): KeyboardSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [KeyboardSvgIcon.tag]: KeyboardSvgIcon;
    }
}

export { KeyboardSvgIcon };
