/// <reference types="emscripten" />
import { SvgIcon } from './SvgIcon.js';
import '../../utils/ScanditHTMLElement.js';

declare class CalendarExclamationMarkSvgIcon extends SvgIcon {
    static tag: "scandit-calendar-exclamation-icon";
    static create(): CalendarExclamationMarkSvgIcon;
    static register(): void;
    protected render(): string;
}
declare global {
    interface HTMLElementTagNameMap {
        [CalendarExclamationMarkSvgIcon.tag]: CalendarExclamationMarkSvgIcon;
    }
}

export { CalendarExclamationMarkSvgIcon };
