/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class AimerSvgIcon extends SvgIcon {
    static tag: "scandit-aimer-icon";
    static create(): AimerSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [AimerSvgIcon.tag]: AimerSvgIcon;
    }
}

export { AimerSvgIcon };
