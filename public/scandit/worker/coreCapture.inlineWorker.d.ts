/// <reference types="emscripten" />
import { X as DataCaptureEngine, Y as Module } from '../Camera-C_4xOv5n.js';
import { WorkerMain } from './WorkerMain.js';
import '../private/Serializable.js';
import '../Common.js';
import '../private/FrameReaders/WatermarkStack.js';
import '../tsHelper.js';
import '../ScanditIcon.js';
import '../private/utils/ScanditHTMLElement.js';
import '../DataCaptureContextSettings.js';
import '../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter/NotificationPresenter.js';
import '../NotificationPresenter/NotificationConfiguration.js';
import '../NotificationPresenter/NotificationStyle.js';
import '../ViewControls.js';
import '../private/CustomLocationsView.js';
import '../private/View.js';
import '../private/AnchorPositions.js';
import '../private/nativeHandle.js';
import '../license/OpenSourceSoftwareLicenseInfo.js';
import '../private/HtmlElementState.js';
import './OverrideState.js';
import '../logger.js';
import '../LoadingStatus.js';

declare const workerInstance: WorkerMain<DataCaptureEngine<Module>, Module>;

declare function InlineWorker(_options?: WorkerOptions): Worker;

export { InlineWorker, workerInstance };
