/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class CameraSwitchSvgIcon extends SvgIcon {
    static tag: "scandit-camera-switch-icon";
    static create(): CameraSwitchSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [CameraSwitchSvgIcon.tag]: CameraSwitchSvgIcon;
    }
}

export { CameraSwitchSvgIcon };
