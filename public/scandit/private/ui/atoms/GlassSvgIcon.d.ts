/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class GlassSvgIcon extends SvgIcon {
    static tag: "scandit-glass-icon";
    static create(): GlassSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [GlassSvgIcon.tag]: GlassSvgIcon;
    }
}

export { GlassSvgIcon };
