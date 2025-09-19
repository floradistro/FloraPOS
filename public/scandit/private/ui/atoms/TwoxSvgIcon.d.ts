/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class TwoxSvgIcon extends SvgIcon {
    static tag: "scandit-twox-icon";
    static create(): TwoxSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [TwoxSvgIcon.tag]: TwoxSvgIcon;
    }
}

export { TwoxSvgIcon };
