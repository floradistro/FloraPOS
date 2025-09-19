/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class RoundedCheckSvgIcon extends SvgIcon {
    static tag: "scandit-rounded-check-icon";
    static create(): RoundedCheckSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [RoundedCheckSvgIcon.tag]: RoundedCheckSvgIcon;
    }
}

export { RoundedCheckSvgIcon };
