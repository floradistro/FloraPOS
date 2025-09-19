/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class PrinterSvgIcon extends SvgIcon {
    static tag: "scandit-printer-icon";
    static create(): PrinterSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [PrinterSvgIcon.tag]: PrinterSvgIcon;
    }
}

export { PrinterSvgIcon };
