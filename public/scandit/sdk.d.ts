/// <reference types="emscripten" />
import { LoadingStatus } from './LoadingStatus.js';
import './ScanditIcon.js';
import { D as DataCaptureLoader } from './Camera-C_4xOv5n.js';
import './Common.js';
import './private/Serializable.js';
import './private/utils/ScanditHTMLElement.js';
import './private/FrameReaders/WatermarkStack.js';
import './tsHelper.js';
import './DataCaptureContextSettings.js';
import './DataCaptureViewPlusRelated.js';
import './NotificationPresenter/NotificationPresenter.js';
import './NotificationPresenter/NotificationConfiguration.js';
import './NotificationPresenter/NotificationStyle.js';
import './ViewControls.js';
import './private/CustomLocationsView.js';
import './private/View.js';
import './private/AnchorPositions.js';
import './private/nativeHandle.js';
import './license/OpenSourceSoftwareLicenseInfo.js';
import './private/HtmlElementState.js';
import './worker/OverrideState.js';
import './logger.js';

type ConfigurePhase = "done" | "started" | "unconfigured";
interface SDKGlobals {
    configurePhase: ConfigurePhase;
    configurePromise: Promise<void> | null;
    userLicenseKey: string | null;
    mainDataCaptureLoader: DataCaptureLoader | undefined;
    dataCaptureLoaders: Map<string, DataCaptureLoader>;
    loadingStatus: LoadingStatus;
    libraryLocation: string | undefined;
}
type PartialSDKGlobals = Partial<SDKGlobals>;
declare class SDK extends EventTarget implements SDKGlobals {
    userLicenseKey: string | null;
    mainDataCaptureLoader: DataCaptureLoader | undefined;
    dataCaptureLoaders: Map<string, DataCaptureLoader>;
    loadingStatus: LoadingStatus;
    libraryLocation: string | undefined;
    private _configurePhase;
    private _configurePromise;
    constructor();
    set configurePhase(value: ConfigurePhase);
    get configurePhase(): ConfigurePhase;
    set configurePromise(value: Promise<void> | null);
    get configurePromise(): Promise<void> | null;
}
declare const sdk: SDK;

export { type ConfigurePhase, type PartialSDKGlobals, type SDKGlobals, sdk };
