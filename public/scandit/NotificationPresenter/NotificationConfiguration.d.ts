/// <reference types="emscripten" />
import { Color } from '../Common.js';
import { ScanditIcon } from '../ScanditIcon.js';
import { NotificationStyle } from './NotificationStyle.js';
import '../private/Serializable.js';
import '../private/utils/ScanditHTMLElement.js';

declare class NotificationConfiguration {
    private _style?;
    private _icon?;
    private _message;
    private _textColor;
    private _backgroundColor;
    private _tag;
    constructor(message: string, tag: string, style?: NotificationStyle, icon?: ScanditIcon, textColor?: Color, backgroundColor?: Color);
    get tag(): string;
    get message(): string;
    get style(): NotificationStyle | null;
    get icon(): ScanditIcon | null;
    get textColor(): Color;
    get backgroundColor(): Color;
}

export { NotificationConfiguration };
