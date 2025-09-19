/// <reference types="emscripten" />
import { Color } from '../Common.js';
import { ScanditIcon } from '../ScanditIcon.js';
import { NotificationConfiguration } from './NotificationConfiguration.js';
import { NotificationStyle } from './NotificationStyle.js';
import '../private/Serializable.js';
import '../private/utils/ScanditHTMLElement.js';

declare class NotificationBuilder {
    private _text;
    private _tag;
    private _icon?;
    private _style?;
    private _textColor;
    private _backgroundColor;
    private constructor();
    static init(text: string, tag: string): NotificationBuilder;
    withIcon(icon: ScanditIcon): NotificationBuilder;
    withTextColor(color: Color): NotificationBuilder;
    withBackgroundColor(color: Color): NotificationBuilder;
    withNotificationStyle(style: NotificationStyle): NotificationBuilder;
    build(): NotificationConfiguration;
}

export { NotificationBuilder };
