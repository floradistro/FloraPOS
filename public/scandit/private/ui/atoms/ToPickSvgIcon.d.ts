/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class ToPickSvgIcon extends SvgIcon {
    static tag: "scandit-to-pick-icon";
    static create(): ToPickSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [ToPickSvgIcon.tag]: ToPickSvgIcon;
    }
}

export { ToPickSvgIcon };
