/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class StarFilledSvgIcon extends SvgIcon {
    static tag: "scandit-star-filled-icon";
    static create(): StarFilledSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [StarFilledSvgIcon.tag]: StarFilledSvgIcon;
    }
}

export { StarFilledSvgIcon };
