/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class OnexSvgIcon extends SvgIcon {
    static tag: "scandit-onex-icon";
    static create(): OnexSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [OnexSvgIcon.tag]: OnexSvgIcon;
    }
}

export { OnexSvgIcon };
