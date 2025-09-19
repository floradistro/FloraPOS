/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class CameraSwitchReverseSvgIcon extends SvgIcon {
    static tag: "scandit-camera-switch-reverse-icon";
    static create(): CameraSwitchReverseSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [CameraSwitchReverseSvgIcon.tag]: CameraSwitchReverseSvgIcon;
    }
}

export { CameraSwitchReverseSvgIcon };
