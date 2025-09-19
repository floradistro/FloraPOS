/// <reference types="emscripten" />
import { Z as GenericHint } from '../../Camera-C_4xOv5n.js';
import { NotificationConfiguration } from '../NotificationConfiguration.js';
import '../../private/Serializable.js';
import '../../Common.js';
import '../../private/FrameReaders/WatermarkStack.js';
import '../../tsHelper.js';
import '../../ScanditIcon.js';
import '../../private/utils/ScanditHTMLElement.js';
import '../../DataCaptureContextSettings.js';
import '../../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter.js';
import '../NotificationStyle.js';
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

declare function createGenericHintFromNotificationConfiguration(config: NotificationConfiguration): GenericHint;
declare const error: GenericHint;
declare const success: GenericHint;
declare const warning: GenericHint;
declare const info: GenericHint;

export { createGenericHintFromNotificationConfiguration, error, info, success, warning };
