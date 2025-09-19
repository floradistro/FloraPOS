/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class LowStockSvgIcon extends SvgIcon {
    static tag: "scandit-low-stock-icon";
    static create(): LowStockSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [LowStockSvgIcon.tag]: LowStockSvgIcon;
    }
}

export { LowStockSvgIcon };
