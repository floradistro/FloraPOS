/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class Dot5xSvgIcon extends SvgIcon {
    static tag: "scandit-dot5x-icon";
    static create(): Dot5xSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [Dot5xSvgIcon.tag]: Dot5xSvgIcon;
    }
}

export { Dot5xSvgIcon };
