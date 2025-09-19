/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class WrongItemSvgIcon extends SvgIcon {
    static tag: "scandit-wrong-item-icon";
    static create(): WrongItemSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [WrongItemSvgIcon.tag]: WrongItemSvgIcon;
    }
}

export { WrongItemSvgIcon };
