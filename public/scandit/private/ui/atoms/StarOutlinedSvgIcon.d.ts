/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class StarOutlinedSvgIcon extends SvgIcon {
    static tag: "scandit-star-icon";
    static create(): StarOutlinedSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [StarOutlinedSvgIcon.tag]: StarOutlinedSvgIcon;
    }
}

export { StarOutlinedSvgIcon };
