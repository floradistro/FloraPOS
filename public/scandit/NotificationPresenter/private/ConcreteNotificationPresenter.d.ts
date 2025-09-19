/// <reference types="emscripten" />
import { U as HintPresenter } from '../../Camera-C_4xOv5n.js';
import { NotificationConfiguration } from '../NotificationConfiguration.js';
import { NotificationPresenter } from '../NotificationPresenter.js';
import '../../private/Serializable.js';
import '../../Common.js';
import '../../private/FrameReaders/WatermarkStack.js';
import '../../tsHelper.js';
import '../../ScanditIcon.js';
import '../../private/utils/ScanditHTMLElement.js';
import '../../DataCaptureContextSettings.js';
import '../../DataCaptureViewPlusRelated.js';
import '../../ViewControls.js';
import '../../private/CustomLocationsView.js';
import '../../private/View.js';
import '../../private/AnchorPositions.js';
import '../../private/nativeHandle.js';
import '../../license/OpenSourceSoftwareLicenseInfo.js';
import '../../private/HtmlElementState.js';
import '../../worker/OverrideState.js';
import '../../logger.js';
import '../../LoadingStatus.js';
import '../NotificationStyle.js';

declare class ConcreteNotificationPresenter implements NotificationPresenter {
    private _hintPresenter;
    constructor(hintPresenter: HintPresenter);
    showNotification(notificationConfiguration: NotificationConfiguration): Promise<void>;
    hideNotification(notificationConfiguration: NotificationConfiguration): Promise<void>;
}

export { ConcreteNotificationPresenter };
