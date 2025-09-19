/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class StarHalfFilledSvgIcon extends SvgIcon {
    static tag: "scandit-half-star-icon";
    static create(): StarHalfFilledSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [StarHalfFilledSvgIcon.tag]: StarHalfFilledSvgIcon;
    }
}

export { StarHalfFilledSvgIcon };
