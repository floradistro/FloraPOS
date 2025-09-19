/// <reference types="emscripten" />
import { NotificationConfiguration } from './NotificationConfiguration.js';
import '../Common.js';
import '../private/Serializable.js';
import '../ScanditIcon.js';
import '../private/utils/ScanditHTMLElement.js';
import './NotificationStyle.js';

interface NotificationPresenter {
    showNotification(notificationConfiguration: NotificationConfiguration): Promise<void>;
    hideNotification(notificationConfiguration: NotificationConfiguration): Promise<void>;
}

export type { NotificationPresenter };
