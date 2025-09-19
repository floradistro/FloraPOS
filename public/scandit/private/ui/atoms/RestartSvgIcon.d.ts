/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class RestartSvgIcon extends SvgIcon {
    static tag: "scandit-restart-icon";
    static create(): RestartSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [RestartSvgIcon.tag]: RestartSvgIcon;
    }
}

export { RestartSvgIcon };
