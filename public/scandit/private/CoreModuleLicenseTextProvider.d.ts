/// <reference types="emscripten" />
import { ModuleLicenseTextProvider } from './ModuleLicenseTextProvider.js';
import { Logger } from '../logger.js';
import { PartialSDKGlobals } from '../sdk.js';
import '../LoadingStatus.js';
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
import '../worker/OverrideState.js';

declare class CoreModuleLicenseTextProvider implements ModuleLicenseTextProvider {
    private sdk;
    private logger;
    private fetch;
    constructor(sdk?: PartialSDKGlobals, logger?: typeof Logger, fetch?: typeof globalThis.fetch);
    private get workerCommand();
    getLicenseText(): Promise<string>;
    private fetchWebLicenseText;
}

export { CoreModuleLicenseTextProvider };
