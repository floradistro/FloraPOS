/// <reference types="emscripten" />
import { LoadingStatusSubscriber } from '../LoadingStatus.js';
import { ConfigureOptions } from '../index.js';
import { Logger } from '../logger.js';
import { OverrideState } from '../worker/OverrideState.js';
import '../sdk.js';
import '../ScanditIcon.js';
import '../Common.js';
import './Serializable.js';
import './utils/ScanditHTMLElement.js';
import '../Camera-C_4xOv5n.js';
import './FrameReaders/WatermarkStack.js';
import '../tsHelper.js';
import '../DataCaptureContextSettings.js';
import '../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter/NotificationPresenter.js';
import '../NotificationPresenter/NotificationConfiguration.js';
import '../NotificationPresenter/NotificationStyle.js';
import '../ViewControls.js';
import './CustomLocationsView.js';
import './View.js';
import './AnchorPositions.js';
import './nativeHandle.js';
import '../license/OpenSourceSoftwareLicenseInfo.js';
import './HtmlElementState.js';
import '../worker/WorkerMain.js';
import '../AimerViewfinder.js';
import '../Viewfinder.js';
import '../ViewfinderPlusRelated.js';
import '../Brush.js';
import '../DataCaptureError.js';
import '../DataCaptureVersion.js';
import '../Feedback.js';
import '../Sound.js';
import '../Vibration.js';
import '../ImageFrameSource.js';
import '../LaserlineViewfinder.js';
import '../Localization.js';
import '../translations.js';
import '../LocationSelection.js';
import '../NotificationPresenter/NotificationBuilder.js';
import '../RectangularViewfinder.js';
import '../ScanditIconBuilder.js';
import './ui/atoms/SvgIcon.js';
import '../SingleImageUploader.js';
import '../SingleImageUploaderSettings.js';
import 'csstype';
import '../browserCompatibility.js';
import '../browserHelper.js';

/**
 * @hidden
 * Hidden
 * */
interface NormalizedConfigureOptions extends ConfigureOptions {
    loadProgressNotifier?: LoadingStatusSubscriber;
    logLevel: Logger.Level;
    overrideThreadsSupport: OverrideState;
    overrideSimdSupport: OverrideState;
    verifyResponseHash: boolean;
    highEndBlurryRecognition?: boolean;
}

export type { NormalizedConfigureOptions };
