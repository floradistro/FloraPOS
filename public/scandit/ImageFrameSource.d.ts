/// <reference types="emscripten" />
import { a as FrameSource, b as FrameSourceState, c as FrameSourceListener } from './Camera-C_4xOv5n.js';
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

interface ImageFrameSourceJSON {
    /**
     * The official type should be "image", but we cannot use it because it would not work in conjunction
     * with Centaurus.
     */
    type: "imageFrameSource";
}
declare class ImageFrameSource implements FrameSource, Serializable<ImageFrameSourceJSON> {
    /**
     * The official type should be "image", but we cannot use it because it would not work in conjunction
     * with Centaurus.
     * @see toJSONObject
     */
    private readonly type;
    private readonly _listeners;
    private _currentState;
    private _desiredState;
    private _context;
    private _imageData;
    get desiredState(): FrameSourceState;
    private get context();
    private set context(value);
    private get currentState();
    static fromFile(file: File): Promise<ImageFrameSource>;
    static fromImage(image: HTMLImageElement): Promise<ImageFrameSource>;
    static fromImageData(imageData: ImageData): Promise<ImageFrameSource>;
    switchToDesiredState(state: FrameSourceState): Promise<void>;
    addListener(listener: FrameSourceListener | null): void;
    removeListener(listener: FrameSourceListener | null): void;
    toJSONObject(): ImageFrameSourceJSON;
    getCurrentState(): FrameSourceState;
    private getCanvasAndContext;
    private setCurrentState;
    private notifyContext;
    private notifyListeners;
    private processSubmittedImage;
}

export { ImageFrameSource, type ImageFrameSourceJSON };
