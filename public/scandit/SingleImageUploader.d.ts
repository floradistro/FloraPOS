/// <reference types="emscripten" />
import { d as FrameSourceJSON, b as FrameSourceState, a as FrameSource, c as FrameSourceListener } from './Camera-C_4xOv5n.js';
import { SingleImageUploaderSettingsJSON, SingleImageUploaderSettings } from './SingleImageUploaderSettings.js';
import { Serializable } from './private/Serializable.js';
import './Common.js';
import './private/FrameReaders/WatermarkStack.js';
import './tsHelper.js';
import './ScanditIcon.js';
import './private/utils/ScanditHTMLElement.js';
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
import './LoadingStatus.js';
import 'csstype';

interface SingleImageUploaderJSON extends FrameSourceJSON {
    type: "singleImageUploader";
    settings: Record<string, never> | SingleImageUploaderSettingsJSON;
    desiredState: FrameSourceState;
}
type SingleImageUploaderType = "singleImageUploader";
declare class SingleImageUploader implements FrameSource, Serializable<SingleImageUploaderJSON> {
    private readonly type;
    private _currentState;
    private _settings;
    private _desiredState;
    private readonly listeners;
    private _context;
    private _view;
    static get default(): SingleImageUploader;
    get desiredState(): FrameSourceState;
    get settings(): SingleImageUploaderSettings;
    private get context();
    private set context(value);
    private set currentState(value);
    private get currentState();
    switchToDesiredState(state: FrameSourceState): Promise<void>;
    addListener(listener: FrameSourceListener | null): void;
    removeListener(listener: FrameSourceListener | null): void;
    applySettings(settings: SingleImageUploaderSettings): Promise<void>;
    toJSONObject(): SingleImageUploaderJSON;
    getCurrentState(): FrameSourceState;
    /**
     * Does the same as the "currentState" setter, but returns a promise that you can await.
     */
    private setCurrentState;
    private notifyContext;
    private notifyListeners;
    private processUploadedFileCapture;
    private addView;
}

export { SingleImageUploader, type SingleImageUploaderJSON, type SingleImageUploaderType };
