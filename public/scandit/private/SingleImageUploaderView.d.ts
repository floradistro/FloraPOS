/// <reference types="emscripten" />
import { SingleImageUploaderSettings } from '../SingleImageUploaderSettings.js';
import { View } from './View.js';
import 'csstype';
import './Serializable.js';

interface ImageDimensions {
    width: number;
    height: number;
}
interface SingleImageUploaderViewCapture {
    data: Uint8ClampedArray;
    width: number;
    height: number;
}
declare class SingleImageUploaderView implements View {
    private static readonly componentName;
    private static readonly DEFAULT_DOM_ATTRIBUTE;
    canUploadFile: boolean;
    private _mounted;
    private _loading;
    private _htmlRoot;
    private _settings;
    private _canvas;
    private _canvasContext;
    private _onInputCheck;
    private _onBeforeFileRead;
    private _onImageLoadError;
    private _onFileReaderError;
    private _onCaptureReady;
    private _resizedImageSizeLimit;
    private _inputElement;
    private _buttonElement;
    private _chooseImageText;
    constructor(settings: SingleImageUploaderSettings);
    private get canvas();
    private get canvasContext();
    mount(htmlRoot: HTMLElement): void;
    unmount(): void;
    setButtonState(state: "disabled" | "enabled"): void;
    getButtonState(): "disabled" | "enabled";
    onInputCheck(listener: EventListener): void;
    onBeforeFileRead(listener: (event: Event) => Promise<void> | void): void;
    onImageLoadError(listener: EventListener): void;
    onFileReaderError(listener: EventListener): void;
    onCaptureReady(listener: (capture: SingleImageUploaderViewCapture) => void): void;
    onAfterImageProcessed(): void;
    private setLoading;
    private getResizedImageDimensions;
    private onImageLoad;
    private onFileReaderLoad;
    private onFileUpload;
}

export { type ImageDimensions, SingleImageUploaderView, type SingleImageUploaderViewCapture };
