/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class QuestionMarkSvgIcon extends SvgIcon {
    static tag: "scandit-question-mark-icon";
    static create(): QuestionMarkSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [QuestionMarkSvgIcon.tag]: QuestionMarkSvgIcon;
    }
}

export { QuestionMarkSvgIcon };
