/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';
import { MarginsWithUnitJSON, PointWithUnitJSON, Anchor, MarginsWithUnit, PointWithUnit, Size, Orientation, Point, Quadrilateral, JSONType, PointJSON, RectJSON, Rect } from './Common.js';
import { WatermarkStack } from './private/FrameReaders/WatermarkStack.js';
import { Optional, MethodSignature } from './tsHelper.js';
import { ScanditIcon } from './ScanditIcon.js';
import { ScanditHTMLElement } from './private/utils/ScanditHTMLElement.js';
import { DataCaptureContextSettingsJSON, DataCaptureContextSettings } from './DataCaptureContextSettings.js';
import { LogoStyle, FocusGestureJSON, ZoomGestureJSON, FocusGesture, ZoomGesture } from './DataCaptureViewPlusRelated.js';
import { NotificationPresenter } from './NotificationPresenter/NotificationPresenter.js';
import { Control } from './ViewControls.js';
import { DidTapCustomLocationsViewListener, StateToRender, StateToRenderDomView } from './private/CustomLocationsView.js';
import { nativeHandle } from './private/nativeHandle.js';
import { AnchorPositions } from './private/AnchorPositions.js';
import { OpenSourceSoftwareLicenseInfo } from './license/OpenSourceSoftwareLicenseInfo.js';
import { HTMLElementStateJSON } from './private/HtmlElementState.js';
import { OverrideState } from './worker/OverrideState.js';
import { Logger } from './logger.js';
import { ProgressInfo } from './LoadingStatus.js';

declare enum CameraPosition$1 {
    WorldFacing = "worldFacing",
    UserFacing = "userFacing"
}
declare enum CameraResolutionConstraint$1 {
    ULTRA_HD = 0,
    FULL_HD = 1,
    HD = 2,
    SD = 3,
    NONE = 4
}
declare enum AspectRatio {
    AUTO = "auto",
    FOUR_TO_THREE = "fourToThree",
    SIXTEEN_TO_NINE = "sixteenToNine"
}
interface DeviceCamera$1 {
    position: CameraPosition$1;
    label: string;
    deviceId: string;
    currentResolution?: VideoFrameResolution;
}
/**
 * A helper object to interact with cameras.
 */
declare namespace CameraAccess$1 {
    /**
     * Overrides for main camera for a given camera position on a desktop/laptop device, set when accessing an initial camera.
     */
    const mainCameraForPositionOverridesOnDesktop: Map<CameraPosition$1, DeviceCamera$1>;
    /**
     *
     * To be accessed directly only for tests.
     *
     * The mapping from deviceIds to camera objects.
     */
    const deviceIdToCameraObjects: Map<string, DeviceCamera$1>;
    /**
     *
     * To be accessed directly only for tests.
     *
     * The list of inaccessible deviceIds.
     */
    const inaccessibleDeviceIds: Set<string>;
    function setMainCameraForPositionOverridesOnDesktop(cameraPosition: CameraPosition$1, deviceCamera: DeviceCamera$1): void;
    /**
     * used mainly for testing
     */
    function clearMainCameraForPositionOverridesOnDesktop(): void;
    /**
     *
     * @param label The camera label.
     * @returns Whether the label identifies the camera being the iOS front (main) camera one.
     */
    function isIOSFrontCameraLabel(label: string): boolean;
    /**
     *
     * @param label The camera label.
     * @returns Whether the label identifies the camera being the iOS back (main) camera one.
     */
    function isIOSBackCameraLabel(label: string): boolean;
    /**
     *
     * @param label The camera label.
     * @returns Whether the label identifies the camera being the iOS Back Dual camera one.
     */
    function isIOSBackDualWideCameraLabel(label: string): boolean;
    /**
     *
     * @param label The camera label.
     * @returns Whether the label identifies the camera being the iOS UltraWide back camera one.
     */
    function isIOSUltraWideBackCameraLabel(label: string): boolean;
    /**
     *
     * Get the main camera for the given camera position.
     *
     * @param cameras The array of available [[DeviceCamera]] objects.
     * @param cameraPosition The wanted camera position.
     * @returns The main camera matching the wanted camera position.
     */
    function getMainCameraForPosition(cameras: DeviceCamera$1[], cameraPosition: CameraPosition$1): DeviceCamera$1 | undefined;
    /**
     *
     * Sort the given cameras in order of priority of access based on the given camera position.
     *
     * @param cameras The array of available [[DeviceCamera]] objects.
     * @param cameraPosition The preferred camera position.
     * @returns The sorted cameras.
     */
    function sortCamerasForCameraPosition<DeviceCameraLike extends DeviceCamera$1 = DeviceCamera$1>(cameras: DeviceCameraLike[], cameraPosition: CameraPosition$1): DeviceCameraLike[];
    /**
     *
     * Adjusts the camera's information based on the given currently active video stream.
     *
     * @param mediaStream The currently active `MediaStream` object.
     * @param camera The currently active [[Camera]] object associated with the video stream.
     */
    function adjustCameraFromMediaStream(mediaStream: MediaStream, camera: DeviceCamera$1): void;
    /**
     * Get a list of cameras (if any) available on the device, a camera access permission is requested to the user
     * the first time this method is called if needed.
     *
     * If the user denies the necessary camera access permission, a list of cameras with the correct amount of devices is
     * returned in any case, but the cameras will have no available (empty) label and deviceId and can thus not be
     * accessed.
     *
     * If the browser is incompatible the returned promise is rejected with a `UnsupportedBrowserError` error.
     *
     * When refreshing available devices, if updated deviceId information is detected, cameras' deviceId are updated
     * accordingly. This could happen after a camera access and stop in some situations.
     *
     * @param refreshDevices Force a call to refresh available video devices even when information is already available.
     * @param cameraAlreadyAccessed Hint that a camera has already been accessed before, avoiding a possible initial
     * camera access permission request on the first call, in cases this cannot be already reliably detected.
     * @returns A promise resolving to the array of available [[Camera]] objects (could be empty).
     */
    function getCameras(refreshDevices?: boolean, cameraAlreadyAccessed?: boolean): Promise<DeviceCamera$1[]>;
    /**
     *
     * Get the *getUserMedia* *video* parameters to be used given a resolution fallback level and the browser used.
     *
     * @param cameraResolutionConstraint The resolution constraint.
     * @returns The resulting *getUserMedia* *video* parameters.
     */
    function getUserMediaVideoParameters(cameraResolutionConstraint: CameraResolutionConstraint$1, preferredAspectRatio?: AspectRatio): MediaTrackConstraints;
    /**
     *
     * Mark a camera to be inaccessible and thus excluded from the camera list returned by [[getCameras]].
     *
     * @param camera The camera to mark to be inaccessible.
     */
    function markCameraAsInaccessible(camera: DeviceCamera$1): void;
    /**
     *
     * Try to access a given camera for video input at the given resolution level.
     *
     * If a camera is inaccessible because of errors, then it's added to the inaccessible device list. If the specific
     * error is of type `OverconstrainedError` or `NotReadableError` however, this procedure is done later on via a
     * separate external logic; also, in case of an error of type `NotAllowedError` (permission denied) this procedure is
     * not executed, in order to possibly recover if and when the user allows the camera to be accessed again.
     * This is done to allow checking if the camera can still be accessed via an updated deviceId when deviceId
     * information changes, or if it should then be confirmed to be considered inaccessible.
     *
     * Depending on parameters, device features and user permissions for camera access, any of the following errors
     * could be the rejected result of the returned promise:
     * - `AbortError`
     * - `NotAllowedError`
     * - `NotFoundError`
     * - `NotReadableError`
     * - `SecurityError`
     * - `OverconstrainedError`
     *
     * @param cameraResolutionConstraint The resolution constraint.
     * @param camera The camera to try to access for video input.
     * @returns A promise resolving to the `MediaStream` object coming from the accessed camera.
     */
    function accessCameraStream(camera: DeviceCamera$1, cameraResolutionConstraint: CameraResolutionConstraint$1, preferredAspectRatio?: AspectRatio): Promise<MediaStream>;
}

/**
 * these are the public exports from CameraAccess
 */
declare namespace CameraAccess {
    function getCameras(refreshDevices?: boolean, cameraAlreadyAccessed?: boolean): Promise<DeviceCamera[]>;
}
interface DeviceCamera {
    position: CameraPosition$1;
    label: string;
    deviceId: string;
}

declare enum FrameSourceState {
    On = "on",
    Off = "off",
    Standby = "standby",
    Starting = "starting",
    Stopping = "stopping",
    BootingUp = "bootingUp",
    WakingUp = "wakingUp",
    GoingToSleep = "goingToSleep",
    ShuttingDown = "shuttingDown"
}
declare enum TorchState {
    On = "on",
    Off = "off"
}
declare enum CameraPosition {
    WorldFacing = "worldFacing",
    UserFacing = "userFacing"
}
declare enum VideoResolution {
    Auto = "auto",
    HD = "hd",
    FullHD = "fullHd",
    UHD4K = "uhd4k"
}
declare enum FocusGestureStrategy {
    None = "none",
    Manual = "manual",
    ManualUntilCapture = "manualUntilCapture",
    AutoOnLocation = "autoOnLocation"
}
interface FrameSourceListener {
    didChangeState?: (frameSource: FrameSource, newState: FrameSourceState) => void;
}
interface FrameSourceJSON {
    type: string;
}
interface FrameSource extends Serializable<FrameSourceJSON> {
    readonly desiredState: FrameSourceState;
    getCurrentState: () => FrameSourceState;
    switchToDesiredState: (desiredState: FrameSourceState) => Promise<void>;
    addListener: (listener: FrameSourceListener) => void;
    removeListener: (listener: FrameSourceListener) => void;
}
interface CameraSettingsJSONBase {
    preferredResolution: string;
    zoomFactor: number;
    zoomGestureZoomFactor: number;
    api?: number;
}
interface CameraSettingsFromJSON extends CameraSettingsJSONBase {
    focusGestureStrategy: string;
}
interface CameraSettingsJSON extends CameraSettingsJSONBase {
    focus: {
        focusGestureStrategy: string;
        [key: string]: any;
    };
    [key: string]: any;
}
declare function isCameraFrameSource(frameSource?: FrameSource | null): frameSource is Camera;
declare class CameraSettings implements Serializable<CameraSettingsJSON> {
    preferredResolution: VideoResolution;
    zoomFactor: number;
    zoomGestureZoomFactor: number;
    private focus;
    get focusGestureStrategy(): FocusGestureStrategy;
    set focusGestureStrategy(newStrategy: FocusGestureStrategy);
    private static fromJSON;
    constructor();
    constructor(settings: CameraSettings);
    setProperty(name: string, value: any): void;
    getProperty(name: string): any;
    /**
     * The resulting JSON must also contain properties set on the object itself ("hidden" properties)
     */
    toJSONObject(): CameraSettingsJSON & Record<string, any>;
}

interface PoolCapacityOptions {
    minPoolCapacity: number;
    maxPoolCapacity: number;
}
declare abstract class FrameReaderAbstract {
    colorType: ColorType;
    protected readonly _contextWebGL: WebGLRenderingContext;
    protected readonly _maxPoolCapacity: number;
    protected readonly _minPoolCapacity: number;
    /**
     * In mobile applications, particularly on Android, capturing frames at a slow rate can be a common issue,
     * especially in scenarios involving barcode tracking. Using a stack becomes valuable in such situations
     * because it allows us to capture next frame with pixel data while the engine is still processing the previous one,
     * eliminating the need to wait for the engine to finish before capturing the next frame.
     */
    protected _framePool: Optional<WatermarkStack<Uint8ClampedArray>>;
    constructor(contextWebGL: WebGLRenderingContext, options?: PoolCapacityOptions | undefined);
    abstract readFromSource(source: TexImageSource): FrameCapture;
    abstract setup(): void;
    recycle(pixelsData: Uint8ClampedArray): void;
    abstract dispose(): void;
}

declare enum ColorType {
    RGBA = "RGBA",
    GRAYSCALE = "GRAYSCALE"
}
declare class FrameReader extends FrameReaderAbstract {
    colorType: ColorType;
    private _framebuffer;
    private _texture;
    private _frameSize;
    private get _initialized();
    readFromSource(source: TexImageSource): FrameCapture;
    setup(): void;
    dispose(): void;
    private updateFrameSizeIfNeeded;
}

interface DataCaptureContextListener {
    didChangeStatus?: (context: DataCaptureContext$1, contextStatus: ContextStatus) => void;
    didStartObservingContext?: (context: DataCaptureContext$1) => void;
    didChangeFrameSource?: (context: DataCaptureContext$1, frameSource: FrameSource | null) => void;
}
interface ContextStatusJSON {
    code: number;
    isValid: boolean;
    message: string;
}
declare class ContextStatus {
    private _message;
    private _code;
    private _isValid;
    private static fromJSON;
    get message(): string;
    get code(): number;
    get isValid(): boolean;
}
declare enum PrivateMirrorAxis {
    None = "None",
    X = "X",
    Y = "Y"
}

interface DataCaptureOverlay extends Serializable {
    [nativeHandle]?: {
        className: string;
        id: number;
    };
    toJSONObject: () => any;
}
interface DataCaptureViewListener {
    didChangeSize?: (view: DataCaptureView$1, size: Size, orientation: Orientation) => void;
}
interface DataCaptureViewJSON {
    scanAreaMargins: MarginsWithUnitJSON;
    pointOfInterest: PointWithUnitJSON;
    logoAnchor: Anchor;
    logoOffset: PointWithUnitJSON;
    logoHidden: boolean;
    logoStyle: LogoStyle;
    overlays: ReturnType<DataCaptureOverlay["toJSONObject"]>[];
    controls: ReturnType<Control["toJSONObject"]>[];
    focusGesture: FocusGestureJSON | null;
    zoomGesture: ZoomGestureJSON | null;
}
interface DataCaptureViewConnectOptions {
    camera?: Camera;
}
declare class DataCaptureView$1 implements Serializable<DataCaptureViewJSON> {
    focusGesture: FocusGesture | null;
    zoomGesture: ZoomGesture | null;
    private _scanAreaMargins;
    private _pointOfInterest;
    private _logoStyle;
    private _logoAnchor;
    private _logoOffset;
    private _context;
    private readonly overlays;
    private readonly controls;
    private gestureRecognizer;
    private readonly controlWidgets;
    private containerElement;
    private cameraPaintboardElement?;
    private singleImageUploaderPaintboardElement?;
    private frameSourceListener;
    private _previewCamera;
    private get videoElement();
    private visibilityListener;
    private cameraRecoveryListener;
    private controlsElement;
    private cameraRecoveryElement;
    private errorElement;
    private canvasElement;
    private frozenFrame;
    private frozenFrameCanvas;
    private _canvasDrawer;
    private readonly listeners;
    private htmlElement?;
    private htmlElementState?;
    private lastHtmlElementState;
    private isVideoElementDetached;
    private loadingOverlay;
    private customLocationsView;
    private lastFrameSourceState;
    private singleImageUploaderView;
    private orientation;
    private hiddenProperties;
    private orientationObserver;
    private onOrientationChangeListener;
    private hintPresenter;
    private onHintPresenterUpdateHandler;
    private onBeforeShowToastsHandler;
    private onWorkerMessageHandler;
    private localizationSubscription?;
    private htmlElementDidChangeHandler;
    private htmlElementDisconnectedHandler;
    private notificationPresenter;
    constructor();
    get scanAreaMargins(): MarginsWithUnit;
    set scanAreaMargins(margins: MarginsWithUnit);
    get pointOfInterest(): PointWithUnit;
    set pointOfInterest(pointOfInterest: PointWithUnit);
    get logoStyle(): LogoStyle;
    set logoStyle(logoStyle: LogoStyle);
    get logoAnchor(): Anchor;
    set logoAnchor(logoAnchor: Anchor);
    get logoOffset(): PointWithUnit;
    set logoOffset(logoOffset: PointWithUnit);
    private get cameraRecoveryText();
    private get width();
    private get height();
    private get canvasDrawer();
    /**
     * The current context as a PrivateDataCaptureContext
     */
    private get privateContext();
    static forContext(context: DataCaptureContext$1 | null): Promise<DataCaptureView$1>;
    showProgressBar(): void;
    hideProgressBar(): void;
    setProgressBarPercentage(percentage: number | null): void;
    setProgressBarMessage(message: string): void;
    getContext(): DataCaptureContext$1 | null;
    setContext(context: DataCaptureContext$1 | null): Promise<void>;
    connectToElement(element: HTMLElement, options?: DataCaptureViewConnectOptions): void;
    detachFromElement(): void;
    addOverlay(overlay: DataCaptureOverlay): Promise<void>;
    removeOverlay(overlay: DataCaptureOverlay): Promise<void>;
    addListener(listener: DataCaptureViewListener): void;
    removeListener(listener: DataCaptureViewListener): void;
    /**
     * Converts a point in the coordinate system of the last visible frame and maps it to a coordinate in the view.
     * It does *not* take into account if the frameSource is mirrored.
     */
    viewPointForFramePoint(point: Point): Point;
    viewQuadrilateralForFrameQuadrilateral(quadrilateral: Quadrilateral): Quadrilateral;
    addControl(control: Control): void;
    removeControl(control: Control): void;
    toJSONObject(): DataCaptureViewJSON;
    isCameraRecoveryVisible(): boolean;
    setCameraRecoveryVisible(visible: boolean): void;
    allowPictureInPicture(allow: boolean): Promise<void>;
    protected viewAnchorPositionsForFrameAnchorPositions(anchorPositions: AnchorPositions): AnchorPositions;
    protected setDidTapCustomLocationsViewListener(didTapViewListener: DidTapCustomLocationsViewListener): void;
    protected renderCustomLocationsView(state: StateToRender | StateToRenderDomView): void;
    getNotificationPresenter(): NotificationPresenter;
    private removeStyles;
    private onHintPresenterUpdate;
    private clearHtmlElementContent;
    private setupHtmlElement;
    private setupHtmlElementSingleImageUploader;
    private setupHtmlElementVisibility;
    private createStyles;
    private onOrientationChange;
    private htmlElementDidChange;
    private htmlElementDisconnected;
    private handleVideoDisplay;
    private isCanvasDrawerWithMetrics;
    private onWorkerMessage;
    private onBeforeShowToasts;
    private drawEngineCommands;
    private displayError;
    private clearError;
    private controlsUpdated;
    private redrawControls;
    /**
     * Allows capture modes to register their own widgets so that they can be added to the view.
     */
    private registerControlWidget;
    private getControlWidget;
    private onFrameSourceChange;
    private onCameraStateChanged;
    private setVideoElementOpacity;
    private onSingleImageUploaderSettingsChange;
    private setHiddenProperty;
    private onVisibilityChange;
    private cameraRecovery;
    private freezeFrame;
    private unfreezeFrame;
}

type CommandAndPayload<A, C> = A extends {
    command: C;
} ? A : never;
type WorkerCommandPayload<C> = Omit<CommandAndPayload<AnyDataCaptureActionMessage, C>, "command" | "id">;
type WorkerListener = (event: DataCaptureCallbackMessage) => any;
interface DataCaptureLoaderOptions {
    libraryLocation: string;
    verifyResponseHash: boolean;
    loadProgressNotifier?: (info: ProgressInfo) => void;
    logLevel?: Logger.Level;
    overrideSimdSupport: OverrideState;
    overrideThreadsSupport: OverrideState;
    highEndBlurryRecognition?: boolean;
}
/**
 * The DataCaptureLoader class is used by the main thread, it instantiates the worker
 * and sends commands to it. It represents thus the main communication channel
 * between the main thread and the engine running in the worker.
 */
declare class DataCaptureLoader {
    highEndBlurryRecognition?: boolean;
    protected overrideThreadsSupport: OverrideState;
    protected overrideSimdSupport: OverrideState;
    protected verifyResponseHash: boolean;
    protected _dataCaptureWorker?: DataCaptureWorker;
    protected readonly libraryLocation: string;
    protected workerCommandId: number;
    protected readonly workerTasks: Map<number, {
        resolve: (...arguments_: any[]) => any;
        reject: (...arguments_: any[]) => any;
        command: string;
    }>;
    protected readonly workerListeners: WorkerListener[];
    protected workerMessageListener: (event_: MessageEvent<DataCaptureCallbackMessage>) => void;
    protected constructor(options: DataCaptureLoaderOptions);
    get dataCaptureWorker(): DataCaptureWorker;
    protected get name(): string;
    protected get fixedWasmMemory(): number | null;
    static create(options: DataCaptureLoaderOptions): Promise<DataCaptureLoader>;
    load(): Promise<WorkerResponse<"loadLibrary">>;
    /**
     * Send a task (i.e. a command) to the worker. Every task sent has a corresponding Promise object which
     * gets resolved when the worker has processed the request. The tasks are identified by an id which is
     * sent along with the data by both sides.
     */
    workerCommand<C extends DataCaptureActionMessageKey>(command: C, payload: WorkerCommandPayload<C>, transferables?: Transferable[]): Promise<WorkerResponse<C>>;
    terminateDataCaptureWorker(disposeContext?: boolean): Promise<void>;
    addWorkerListener(listener: WorkerListener): void;
    removeWorkerListener(listener: WorkerListener): void;
    getOptions(): Pick<DataCaptureLoaderOptions, "libraryLocation" | "overrideSimdSupport" | "overrideThreadsSupport" | "verifyResponseHash">;
    protected onWorkerMessage(event_: MessageEvent<DataCaptureCallbackMessage>): void;
}

type Change = {
    type: "modeEnabled";
    newValue: boolean;
} | {
    type: "addControl";
    newValue: any;
} | {
    type: "addOverlay";
    newValue: any;
} | {
    type: "cameraSettings";
    newValue: any;
} | {
    type: "frameSourceState";
    newValue: any;
} | {
    type: "removeControl";
    newValue: any;
} | {
    type: "removeOverlay";
    newValue: any;
} | {
    type: "singleImageModeUploaderSettings";
    newValue: any;
} | {
    type: "torchState";
    newValue: any;
} | {
    type: "viewChange";
    newValue: {
        orientation: Orientation;
    } & Partial<HTMLElementStateJSON>;
} | {
    type: "viewSet";
    newValue: DataCaptureView$1 | null;
};
type PrivateChangeSet = Change[];
interface DataCaptureMode extends Serializable {
    isEnabled(): boolean;
    setEnabled(enabled: boolean): Promise<void>;
    context: Optional<DataCaptureContext$1>;
}
interface PrivateDataCaptureMode extends DataCaptureMode {
    type: "barcodeCapture" | "idCapture";
    skipSerialization?: boolean;
    [nativeHandle]?: symbol;
    _context: Optional<DataCaptureContext$1>;
    attachedToContext: (context: DataCaptureContext$1) => Promise<void>;
    detachedFromContext: () => Promise<void>;
    _synchronousFrameFlow?: boolean;
}
interface DataCaptureModeJSON<S = JSONType> {
    type: "barcodeCapture" | "barcodeTracking" | "idCapture" | "parser" | "sparkScan" | "barcodeFind" | "barcodeAr" | "labelCapture";
    enabled: boolean;
    settings: S;
}
interface PrivateDataCaptureComponent {
    _context: DataCaptureContext$1;
}
type DataCaptureComponentJSON = JSONType;
interface DataCaptureComponent extends Serializable<DataCaptureComponentJSON> {
    readonly id: string;
}
interface PrivateDataCaptureContextOptions {
    deviceName?: string | null;
    dataCaptureInstance?: DataCaptureLoader;
    delayedRegistration?: boolean;
    licenseKey?: string;
    settings?: DataCaptureContextSettings;
}
interface PrivateDataCaptureContext<W extends (...parameters: any[]) => unknown = DataCaptureLoader["workerCommand"]> {
    _frameSource?: FrameSource | null;
    _useSynchronousFrameFlow: boolean;
    modes: Set<DataCaptureMode>;
    components: DataCaptureComponent[];
    createContext: (subscribeToCameraManagerAndVisibilityEvents?: boolean) => Promise<void>;
    update: (changeSet?: PrivateChangeSet, { updateContext }?: {
        updateContext?: boolean;
    }) => Promise<void>;
    addNativeOverlay: (overlay: DataCaptureOverlay) => Promise<void>;
    removeNativeOverlay: (overlay: DataCaptureOverlay) => Promise<void>;
    addComponent: (component: DataCaptureComponent) => Promise<void>;
    dataCaptureInstance: DataCaptureLoader;
    sendFrameToProcessor: (capture: FrameCapture) => Promise<WorkerResponse<"processFrame">>;
    subscribeToWorkerMessages: (listener: (message: DataCaptureCallbackMessage) => void) => void;
    unsubscribeToWorkerMessages: (listener: (message: DataCaptureCallbackMessage) => void) => void;
    hasEnabledMode: () => boolean;
    hasModes: () => boolean;
    workerCommand: MethodSignature<W>;
    performanceMark: MethodSignature<DataCaptureContext$1["performanceMark"]>;
    isFeatureSupported: (feature: LicensedFeature) => Promise<boolean>;
    new (): DataCaptureContext$1;
    updateListeners: Set<(change: Change) => void>;
    updateCameraFrameFlow: (synchronous: boolean) => void;
    getView: () => DataCaptureView$1 | null;
}
interface DataCaptureContextCreationOptions {
    deviceName?: string;
    licenseKey?: string;
    settings?: DataCaptureContextSettings;
}
interface RuntimeEnvironment {
    deviceOS: string;
    browser: string;
    browserVersion: string;
    deviceModelName: string;
}
interface DataCaptureContextJSON extends RuntimeEnvironment {
    framework: string;
    settings: DataCaptureContextSettingsJSON;
    licenseKey: string;
    deviceName: string;
    frameSource: FrameSourceJSON | null;
    modes: DataCaptureModeJSON[];
    components: DataCaptureComponentJSON[];
    view: DataCaptureViewJSON | null;
}
type PrivateFrameHandlerResponse = {
    action: "continue" | "skip";
    frame: FrameCapture;
};
type PrivateFrameHandler = (frame: FrameCapture) => Promise<PrivateFrameHandlerResponse>;
declare class DataCaptureContext$1 implements Serializable<DataCaptureContextJSON> {
    static deviceID: string;
    private static readonly moduleLicenseTextProviders;
    private readonly framework;
    private readonly runtimeEnvironment;
    private settings;
    private licenseKey;
    private deviceName;
    private _frameSource;
    private _view;
    private readonly modes;
    private readonly components;
    private listeners;
    private readonly updateListeners;
    private readonly cameraPropertiesReportListener;
    private readonly cameraAccessErrorListener;
    private readonly onWorkerMessageListener;
    private readonly onVisibilityChangeListener;
    private dataCaptureInstance;
    private readonly pendingWorkerMessageListeners;
    private delayedRegistration;
    private highEndBlurryRecognition;
    private readonly _frameHandlers;
    /**
     * When synchronous, only one frame is processed at a time by the capture mode, the frame source will wait until the
     * frame data is back to send the next frame.
     *
     * IdCapture uses the synchronous flow because BlinkID only processes one frame at a time.
     * MatrixScan and other barcode modes usually use the asynchronous flow because they can use multi-threading.
     */
    private _useSynchronousFrameFlow;
    private static _sharedInstance;
    static get sharedInstance(): DataCaptureContext$1;
    private initializeWithOptions;
    get frameSource(): FrameSource | null;
    private get workerCommand();
    static create(): Promise<DataCaptureContext$1>;
    static createWithOptions(options: DataCaptureContextCreationOptions): Promise<DataCaptureContext$1>;
    static getOpenSourceSoftwareLicenseInfo(): Promise<OpenSourceSoftwareLicenseInfo>;
    /**
     * Disconnect the current frame source from the context and connect the new one. This process can happen multiple
     * times for the same frame source because of its initialisation (The mirroring info of a camera is only available
     * when it has started for example).
     * Trigger the "didChangeFrameSource" listeners only if the new frame source is different than the old one.
     */
    setFrameSource(frameSource: FrameSource | null): Promise<void>;
    addListener(listener: DataCaptureContextListener): void;
    flushAnalytics(): Promise<void>;
    removeListener(listener: DataCaptureContextListener): void;
    addMode(mode: DataCaptureMode): Promise<void>;
    removeMode(mode: DataCaptureMode): Promise<void>;
    setMode(mode: DataCaptureMode): Promise<void>;
    removeCurrentMode(): Promise<void>;
    /**
     * @deprecated Use removeCurrentMode instead.
     */
    removeAllModes(): Promise<void>;
    dispose(): Promise<void>;
    applySettings(settings: DataCaptureContextSettings): Promise<void>;
    toJSONObject(): DataCaptureContextJSON;
    private getView;
    private setView;
    private getAppName;
    private urlToHostname;
    private getParentDomain;
    private createContext;
    private subscribeToVisibilityChange;
    private unsubscribeToVisibilityChange;
    private requestFrameData;
    private performanceMark;
    private sendFrameToProcessor;
    private sendFrameToHandlers;
    private sendFrameToSDC;
    private registerFrameHandler;
    private unregisterFrameHandler;
    private onVisibilityChange;
    private onWorkerMessage;
    private subscribeToCameraManagerEvents;
    private reportCameraProperties;
    private onCameraAccessError;
    private update;
    private updateContext;
    private getViewInfo;
    private getMirrorAxisForFrameSource;
    private addComponent;
    private addNativeOverlay;
    private removeNativeOverlay;
    private subscribeToWorkerMessages;
    private unsubscribeToWorkerMessages;
    private hasEnabledMode;
    /**
     * Some capture modes process frames synchronously, like IdCapture. Other can process multiple frames
     * in parallel, like MatrixScan. We inform the CameraManager how to process frames.
     */
    private updateCameraFrameFlow;
    private isFeatureSupported;
}

/**
 * MESSAGES (ACTIONS) SENT TO THE WORKER
 */
type DataCaptureActionMessageKey = "createContext" | "deleteFrameData" | "dispose" | "documentVisibility" | "extractCentaurusLicense" | "flushAnalytics" | "isFeatureSupported" | "loadLibrary" | "onTap" | "processFrame" | "reportCameraProperties" | "requestFrameData" | "setFrameSource" | "setLogLevel" | "updateContext" | "hintPresenterV2update" | "getViewfinderInfo" | "getOpenSourceSoftwareLicenseInfo" | "addNativeOverlay" | "removeNativeOverlay";
interface ExtractCentaurusLicenseResponse {
    centaurus: {
        licenseKey: string;
    };
}
interface RequestFrameDataResponse {
    data: Uint8ClampedArray | null;
}
interface IsFeatureSupportedResponse {
    supported: boolean;
}
interface GetViewfinderInfo {
    isDisplayingViewfinder: boolean;
    rect: RectJSON;
}
interface GetOpenSourceSoftwareLicenseInfoResponse {
    licenseText: string;
}
type WorkerResponse<C> = C extends "processFrame" ? ProcessFrameParameters : C extends "extractCentaurusLicense" ? ExtractCentaurusLicenseResponse : C extends "requestFrameData" ? RequestFrameDataResponse : C extends "isFeatureSupported" ? IsFeatureSupportedResponse : C extends "getViewfinderInfo" ? GetViewfinderInfo : C extends "getOpenSourceSoftwareLicenseInfo" ? GetOpenSourceSoftwareLicenseInfoResponse : undefined;
interface DataCaptureActionMessage {
    command: DataCaptureActionMessageKey;
    id: number;
}
type LoadLibraryDataCaptureAction = DataCaptureActionMessage & LoadLibraryParameters & {
    command: "loadLibrary";
};
type CreateContextDataCaptureAction = CreateContextParameters & DataCaptureActionMessage & {
    command: "createContext";
};
type SetFrameSourceDataCaptureAction = DataCaptureActionMessage & SetFrameSourceParameters & {
    command: "setFrameSource";
};
type ProcessFrameDataCaptureAction = DataCaptureActionMessage & ProcessFrameParameters & {
    command: "processFrame";
};
type RequestFrameDataDataCaptureAction = DataCaptureActionMessage & {
    command: "requestFrameData";
    frameId: number;
};
type DeleteFrameDataDataCaptureAction = DataCaptureActionMessage & {
    command: "deleteFrameData";
    frameId: number;
};
type VisibilityChangeAction = DataCaptureActionMessage & {
    command: "documentVisibility";
    state: DocumentVisibilityState;
};
type IsFeatureSupportedAction = DataCaptureActionMessage & {
    command: "isFeatureSupported";
    feature: LicensedFeature;
};
type UpdateContextDataCaptureAction = DataCaptureActionMessage & {
    command: "updateContext";
    context: DataCaptureContextJSON;
    view: UpdateContextParameters["view"];
};
type DisposeDataCaptureAction = DataCaptureActionMessage & {
    command: "dispose";
};
type FlushAnalyticsDataCaptureAction = DataCaptureActionMessage & {
    command: "flushAnalytics";
};
type ReportCameraPropertiesDataCaptureAction = DataCaptureActionMessage & ReportCameraPropertiesParameters & {
    command: "reportCameraProperties";
};
type SetLogLevelDataCaptureAction = DataCaptureActionMessage & {
    command: "setLogLevel";
    level: Logger.Level;
};
type ExtractCentaurusLicenseDataCaptureAction = DataCaptureActionMessage & {
    command: "extractCentaurusLicense";
    licenseKey: string;
};
type OnTapAction = DataCaptureActionMessage & {
    command: "onTap";
    point: PointJSON;
};
type HintPresenterV2updateAction = DataCaptureActionMessage & {
    command: "hintPresenterV2update";
};
type GetViewfinderInfoAction = DataCaptureActionMessage & {
    command: "getViewfinderInfo";
};
type GetOpenSourceSoftwareLicenseInfoAction = DataCaptureActionMessage & {
    command: "getOpenSourceSoftwareLicenseInfo";
};
type AddNativeOverlayAction = DataCaptureActionMessage & {
    command: "addNativeOverlay";
    overlayHandle: {
        className: string;
        id: number;
    };
};
type RemoveNativeOverlayAction = DataCaptureActionMessage & {
    command: "removeNativeOverlay";
    overlayHandle: {
        className: string;
        id: number;
    };
};
type AnyDataCaptureActionMessage = CreateContextDataCaptureAction | DeleteFrameDataDataCaptureAction | DisposeDataCaptureAction | ExtractCentaurusLicenseDataCaptureAction | FlushAnalyticsDataCaptureAction | IsFeatureSupportedAction | LoadLibraryDataCaptureAction | OnTapAction | ProcessFrameDataCaptureAction | ReportCameraPropertiesDataCaptureAction | RequestFrameDataDataCaptureAction | SetFrameSourceDataCaptureAction | SetLogLevelDataCaptureAction | UpdateContextDataCaptureAction | VisibilityChangeAction | HintPresenterV2updateAction | GetViewfinderInfoAction | GetOpenSourceSoftwareLicenseInfoAction | AddNativeOverlayAction | RemoveNativeOverlayAction;
/**
 * MESSAGES EMITTED BY THE WORKER
 */
type DataCaptureCallbackMessageKeys = "contextDidChangeStatus" | "didStartObservingContext" | "draw" | "hideHint" | "isFeatureSupported" | "loadLibraryProgress" | "performanceMetricsReport" | "showHint" | "successFeedback" | "updateHint" | "workerTaskId" | "onFrameProcessingStarted" | "onFrameProcessingFinished" | "onFrameSkipped" | "showToast" | "hideToast" | "showGuidance" | "hideGuidance" | "startUpdateTimer" | "stopUpdateTimer" | "setViewfinderRect";
interface BaseDataCaptureCallbackMessage {
    type: DataCaptureCallbackMessageKeys;
}
interface LoadLibraryProgressMessage {
    type: "loadLibraryProgress";
    payload: ProgressInfo;
}
interface ConsoleWorkerMessage {
    type: "console";
    payload: string;
}
interface WorkerTaskIdWorkerMessage extends BaseDataCaptureCallbackMessage {
    type: "workerTaskId";
    command: string;
    id: number;
    error?: unknown;
    payload?: unknown;
}
type DrawWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "draw";
    payload: Uint8Array;
};
type DidChangeStatusWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "contextDidChangeStatus";
    payload: ContextStatusJSON;
};
type StartObservingContextWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "didStartObservingContext";
};
type SuccessFeedbackWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "successFeedback";
};
type ShowHintWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "showHint";
    payload: {
        text: string;
        style: HintStyle;
    };
};
type UpdateHintWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "updateHint";
    payload: {
        style: HintStyle;
    };
};
type IsFeatureSupportedMessage = BaseDataCaptureCallbackMessage & {
    type: "isFeatureSupported";
    payload: {
        [key in LicensedFeature]: boolean;
    };
};
type HideHintWorkerMessage = BaseDataCaptureCallbackMessage & {
    type: "hideHint";
    payload: Record<string, never>;
};
type PerformanceMetricsReportMessage = BaseDataCaptureCallbackMessage & {
    type: "performanceMetricsReport";
    payload: PerformanceMetrics;
};
type DidTapTrackedBarcode = BaseDataCaptureCallbackMessage & {
    type: "didTapTrackedBarcode";
    payload: any;
};
type OnFrameProcessingStartedMessage = BaseDataCaptureCallbackMessage & {
    type: "onFrameProcessingStarted";
};
type OnFrameProcessingFinishedMessage = BaseDataCaptureCallbackMessage & {
    type: "onFrameProcessingFinished";
};
type OnFrameSkippedMessage = BaseDataCaptureCallbackMessage & {
    type: "onFrameSkipped";
};
type ShowToastMessage = BaseDataCaptureCallbackMessage & {
    type: "showToast";
    payload: GenericHint;
};
type HideToastMessage = BaseDataCaptureCallbackMessage & {
    type: "hideToast";
    payload: GenericHint;
};
type ShowGuidanceMessage = BaseDataCaptureCallbackMessage & {
    type: "showGuidance";
    payload: GenericHint;
};
type HideGuidanceMessage = BaseDataCaptureCallbackMessage & {
    type: "hideGuidance";
    payload: GenericHint;
};
type StartUpdateTimerMessage = BaseDataCaptureCallbackMessage & {
    type: "startUpdateTimer";
    payload: {
        duration: {
            unit: "ms";
            value: number;
        };
    };
};
type StopUpdateTimerMessage = BaseDataCaptureCallbackMessage & {
    type: "stopUpdateTimer";
};
type DataCaptureCallbackMessage = ConsoleWorkerMessage | DidChangeStatusWorkerMessage | DrawWorkerMessage | HideHintWorkerMessage | IsFeatureSupportedMessage | LoadLibraryProgressMessage | PerformanceMetricsReportMessage | ShowHintWorkerMessage | StartObservingContextWorkerMessage | SuccessFeedbackWorkerMessage | UpdateHintWorkerMessage | WorkerTaskIdWorkerMessage | OnFrameProcessingStartedMessage | OnFrameProcessingFinishedMessage | OnFrameSkippedMessage | ShowToastMessage | HideToastMessage | ShowGuidanceMessage | HideGuidanceMessage | StartUpdateTimerMessage | StopUpdateTimerMessage;
/**
 * OTHERS
 */
type PayloadForCommand<A, C> = A extends {
    command: C;
} ? A : never;
interface DataCaptureWorker extends Omit<Worker, "postMessage"> {
    onmessage: ((this: Worker, event_: MessageEvent & {
        data: unknown;
    }) => void) | null;
    postMessage: <C extends AnyDataCaptureActionMessage["command"]>(message: PayloadForCommand<AnyDataCaptureActionMessage, C>, transfer?: Transferable[]) => void;
}
interface EmscriptenClassHandle<Self = EmscriptenClassHandle<unknown>> {
    clone: () => Self;
    delete: () => void;
    isDeleted: () => boolean;
    deleteLater: () => void;
    isAliasOf: () => Self;
}
interface DataCaptureContext extends EmscriptenClassHandle {
    setCameraProperties: (deviceId: string, isFrontFacing: boolean, hasAutofocus: boolean) => void;
    addListener: (function_: unknown) => void;
    addFrameListener: (listener: unknown) => void;
    dispose: () => void;
    setFrameSource: (source: EmscriptenClassHandle) => void;
    flushAnalytics: () => void;
    isFeatureSupported: (feature: LicensedFeature) => boolean;
}
interface DataCaptureImageBufferFrameSource extends EmscriptenClassHandle {
    outputFrame: (address: number, width: number, height: number, format: unknown) => void;
}
interface GestureListener extends EmscriptenClassHandle<GestureListener> {
    onTap(point: string): void;
}
interface GestureRecognizer extends EmscriptenClassHandle {
    setGestureListener(gestureListener: GestureListener, flags: number): void;
}
interface DataCaptureView extends EmscriptenClassHandle {
    setViewSize: (w: number, h: number, orientation: Orientation) => void;
    setNeedsRedrawDelegate: (delegate: unknown) => void;
    draw: () => void;
    getDrawCommands: () => Uint8Array;
    isViewRefreshHandlerSet: boolean;
    hintPresenterInitialized: () => boolean;
    setHintPresenter: (hintPresenter: unknown) => void;
    setHintPresenterV2: (hintPresenterV2: HintPresenterV2) => void;
    setGestureRecognizer: (recognizer: GestureRecognizer) => void;
    isDisplayingViewfinder: () => boolean;
    getViewfinderRect: () => string;
    addOverlay: (overlay: EmscriptenClassHandle) => void;
    removeOverlay: (overlay: EmscriptenClassHandle) => void;
}
interface JSONParseable extends EmscriptenClassHandle {
    toJson: () => string;
}
interface DataCaptureContextDeserializerResult extends EmscriptenClassHandle {
    getContext: () => DataCaptureContext;
    getView: () => DataCaptureView | undefined;
}
interface DataCaptureContextDeserializer extends EmscriptenClassHandle {
    contextFromJson: (json: string) => DataCaptureContextDeserializerResult | null;
    updateContextFromJson: (context: DataCaptureContext, view: DataCaptureView | undefined, json: string) => DataCaptureContextDeserializerResult | null;
    getLastError: () => string;
}
interface CaptureModeDeserializerInstance extends EmscriptenClassHandle {
    setListener: (listener: unknown) => void;
}
interface ModuleMirrorAxis {
    None: unknown;
    X: unknown;
    Y: unknown;
}
interface Vector<T = unknown> {
    push_back: (element: unknown) => void;
    get: (index: number) => T;
    size: () => number;
}
interface WasmFrameData extends EmscriptenClassHandle {
    getFrameData: () => Uint8ClampedArray;
    getWidth: () => number;
    getHeight: () => number;
    getMirrorAxis: () => unknown;
    getOrientation: () => unknown;
}
declare enum HintFont {
    Body = "body",
    Footnote = "footnote"
}
declare enum HintTextAlignment {
    Start = "start",
    Center = "center",
    End = "end"
}
declare enum HintWidth {
    Normal = "normal",
    Wider = "wider",
    FitText = "fitText"
}
declare enum HintHeight {
    Normal = "normal",
    Taller = "taller"
}
declare enum HintCornerStyle {
    Square = "square",
    Rounded = "rounded"
}
declare enum HintIcon {
    None = "none",
    Check = "check",
    ExclamationMark = "exclamationMark"
}
declare enum HintAnchor {
    Top = "top",
    AboveViewFinder = "aboveViewFinder",
    BelowViewFinder = "belowViewFinder"
}
interface HintStyle {
    textColor: string;
    textAlignment: HintTextAlignment;
    backgroundColor: string;
    hintIcon: HintIcon;
    isAnimatedToView: boolean;
    hintAnchor: HintAnchor;
    hintAnchorOffset: number;
    horizontalMargin: number;
    maxWidthFraction: number;
    textSize: number;
    textWeight: number;
    lineHeight: number;
    iconColor: string;
    maxLines: number;
    cornerRadius: number;
    fitToText: boolean;
    /**
     * Will be removed after Id Capture migrates to HintPresenter v2
     * @deprecated
     */
    anchor: Anchor;
    /**
     * @deprecated
     */
    verticalOffsetRatio: number;
    /**
     * @deprecated
     */
    font: HintFont;
    /**
     * @deprecated
     */
    hintWidth: HintWidth;
    /**
     * @deprecated
     */
    hintHeight: HintHeight;
    /**
     * @deprecated
     */
    hintCornerStyle: HintCornerStyle;
}
declare enum GuidanceHintAnchor {
    AboveViewFinder = "aboveViewFinder",
    BelowViewFinder = "belowViewFinder"
}
declare enum GuidanceHintStyle {
    BlackOnWhite = "blackOnWhite",
    WhiteOnBlack = "whiteOnBlack",
    Transparent = "transparent"
}
interface GuidanceHint {
    text: string;
    guidanceHintStyle: GuidanceHintStyle;
    guidanceHintAnchor: GuidanceHintAnchor;
    hintStyle?: HintStyle;
    moveCloserAnimation?: boolean;
}
declare enum ToastHintStyle {
    Success = "success",
    Error = "error",
    Warning = "warning",
    Info = "info",
    Notification = "notification"
}
interface ToastHint {
    text: string;
    tag: string;
    toastHintStyle: ToastHintStyle;
    hintStyle?: HintStyle;
}
interface GenericHint {
    text: string;
    tag?: string;
    hintStyle: Omit<HintStyle, "anchor" | "verticalOffsetRatio" | "font" | "hintWidth" | "hintHeight" | "hintCornerStyle">;
}
interface PerformanceMetrics {
    processedFramesCount: number;
    redrawRequestsCount: number;
    actualRedrawsCount: number;
    frameDataPoolSize: number;
}
declare enum LicensedFeature {
    Ocr = 0,
    HideLogo = 1,
    ShowTestLicenseMessage = 2,
    AugmentedReality = 5,
    ActivityPingStatsAddon = 8,
    ActivityPing = 9,
    Registration = 10,
    Parser = 11,
    BarcodeCapture = 14,
    Analytics = 17,
    AnalyticsBatchMode = 18,
    AnalyticsScanContent = 19,
    AnalyticsOnlineVerification = 20,
    SparkScan = 21,
    AamvaIdBarcodeVerification = 22,
    MappingForTracking = 23,
    BarcodeFind = 24,
    MandatoryRegistration = 25,
    FeatureTracking = 26,
    IdCaptureViz = 27,
    IdCaptureMrz = 28,
    IdCaptureBarcode = 29,
    BarcodeSelectionAimToScan = 30,
    BarcodeSelectionTapToScan = 31,
    BarcodeCount = 32,
    BarcodePick = 33,
    IdVerificationDataComparison = 34,
    SmartLabelBarcode = 35,
    SmartLabelText = 36,
    VoidedIdDetection = 37,
    BarcodeArFull = 38
}
interface HintPresenterV2 extends EmscriptenClassHandle {
    showToast: (toastHint: string) => void;
    hideToast: (tag: string) => void;
    hideAllToasts: () => void;
    showGuidance: (guidanceHint: string) => void;
    hideCurrentGuidance: () => void;
    update: () => void;
}
interface PlatformHintPresenter extends EmscriptenClassHandle {
    setHintPresenter(presenter: HintPresenterV2): void;
    showToast(toast: string): void;
    hideToast(toast: string): void;
    showGuidance(guidanceHint: string): void;
    hideGuidance(guidanceHint: string): void;
    startUpdateTimer(intervalMs: number): void;
    stopUpdateTimer(): void;
}
interface Module extends EmscriptenModule {
    callMain: () => void;
    canvas: OffscreenCanvas | undefined;
    __emscripten_proxy_main?: Record<number | string | symbol, unknown>;
    mainScriptUrlOrBlob: string;
    DataCaptureContextDeserializer: new (fsFolderPath: string, deviceId: string, deviceModel: string, domain: string, parentDomain: string, modeDeserializer: Vector, delayedRegistration: boolean, highEndBlurryRecognition: boolean, resourcePath: string) => DataCaptureContextDeserializer;
    DataCaptureContextListener: {
        extend: (target: "DataCaptureContextListener", parameters: {
            didChangeStatus: (context: DataCaptureContext, contextStatus: {
                toJson: () => string;
            }) => void;
            didStartObservingContext: (context: DataCaptureContext) => void;
            didStopObservingContext: (context: DataCaptureContext) => void;
        }) => new () => EmscriptenClassHandle;
    };
    DataCaptureContextFrameListener: {
        extend: (target: "DataCaptureContextFrameListener", parameters: {
            onObservationStarted: (context: DataCaptureContext) => void;
            onObservationStopped: (context: DataCaptureContext) => void;
            onFrameProcessingStarted: (context: DataCaptureContext, frameData: WasmFrameData) => void;
            onFrameProcessingFinished: (context: DataCaptureContext, frameData: WasmFrameData) => void;
            onFrameSkipped: (context: DataCaptureContext, frameData: WasmFrameData) => void;
        }) => new () => EmscriptenClassHandle;
    };
    HintPresenter: {
        extend: (target: "HintPresenter", parameters: {
            showHint: (hint: string, style: string) => void;
            updateHint: (style: string) => void;
            hideHint: () => void;
        }) => new () => EmscriptenClassHandle;
    };
    PlatformHintPresenter: {
        extend: (target: "PlatformHintPresenter", parameters: {
            setHintPresenter(presenter: HintPresenterV2): void;
            showToast(toastHint: string): void;
            hideToast(toastHint: string): void;
            showGuidance(guidanceHint: string): void;
            hideGuidance(guidanceHint: string): void;
            startUpdateTimer(intervalMs: number): void;
            stopUpdateTimer(): void;
        }) => new () => PlatformHintPresenter;
    };
    HintPresenterV2: new (platformHintPresenter: PlatformHintPresenter) => HintPresenterV2;
    ImageBufferFrameSource: new (mirroredAxis: unknown, isCameraFrameSource: boolean, orientation?: number) => DataCaptureImageBufferFrameSource;
    ImageBufferFormat: {
        Grayscale8: unknown;
        Rgb888: unknown;
        Rgba8888: unknown;
    };
    Axis: ModuleMirrorAxis;
    NeedsRedrawDelegate: {
        extend: (target: "NeedsRedrawDelegate", parameters: {
            setNeedsRedrawIn: (inMs: number) => void;
        }) => new () => EmscriptenClassHandle;
    };
    GestureRecognizer: {
        extend: (target: "GestureRecognizer", parameters: {
            setGestureListener(gestureListener: GestureListener, flags: number): void;
        }) => new () => GestureRecognizer;
    };
    VectorDataCaptureModeDeserializer: new () => Vector;
    allocateUint8Array: (length: number) => number;
    deleteUint8Array: (adress: number) => void;
    DataDecoding: {
        extend: (target: "DataDecoding", options: {
            decode: (rawData: ArrayBuffer, encodingRanges: string) => string;
        }) => new () => EmscriptenClassHandle;
    };
    setDataDecoding: (decoder: unknown) => void;
    LicenseUtils: {
        getBlinkIdLicenseKey: (scanditLicense: string) => string;
    };
    Feedback: {
        extend: (target: "Feedback", parameters: {
            emit: () => void;
        }) => new () => EmscriptenClassHandle;
    };
    dispose: () => void;
    LicenseFeature: LicensedFeature;
    addBarcodeFindToContext: (context: DataCaptureContext, mode: EmscriptenClassHandle) => void;
    removeBarcodeFindFromContext: (context: DataCaptureContext, mode: EmscriptenClassHandle) => void;
    addBarcodeFindBasicOverlayToView: (view: DataCaptureView, overlay: EmscriptenClassHandle) => void;
    removeBarcodeFindBasicOverlayFromView: (view: DataCaptureView, overlay: EmscriptenClassHandle) => void;
    addBarcodeArToContext: (context: DataCaptureContext, mode: EmscriptenClassHandle) => void;
    removeBarcodeArFromContext: (context: DataCaptureContext, mode: EmscriptenClassHandle) => void;
    OpenSourceSoftwareLicenseInfo: {
        getLicenseText(): string;
    };
}
type AugmentedWorker<M extends EmscriptenModule> = Worker & {
    Module: M;
    OffscreenCanvas: new (w: number, h: number) => OffscreenCanvas;
};
type EngineWorkerResponse<C extends DataCaptureActionMessageKey> = WorkerResponse<C> extends Promise<void> | void ? Promise<void> | void : {
    payload: WorkerResponse<C>;
    transferables?: Transferable[];
};
interface ModuleHandler<M extends Module> {
    get: () => M;
    set: (v: M) => void;
}

interface FrameData {
    readonly width: number;
    readonly height: number;
    readonly isFrameSourceMirrored: boolean;
    toBlob(type?: string, quality?: number): Promise<Blob | null>;
    getData(): Promise<Uint8ClampedArray | null>;
}
type PrivateLoadableFrameData = Omit<FrameData, "getData" | "toBlob"> & {
    frameId: number;
};
/**
 * Adds some function to the passed frame data object to let the user load the frame data.
 */
declare function convertToPublicFrameData(loadableFrameData: PrivateLoadableFrameData, context: DataCaptureContext$1): FrameData;

declare enum HintPresenterEvents {
    Update = "hintpresenterupdate"
}
declare class HintPresenter extends ScanditHTMLElement {
    static readonly tag: "scandit-hints";
    private intervalId;
    private root;
    private _viewFinderRect;
    private onDidToastHideHandler;
    private orientationObserver;
    private onOrientationChangeHandler;
    constructor();
    private static createStyleElement;
    static register(): void;
    static create(): HintPresenter;
    connectedCallback(): void;
    disconnectedCallback(): void;
    setViewFinderRect(rect: Rect | null): void;
    handleMessage(message: DataCaptureCallbackMessage): Promise<void>;
    private setHintStyleToToast;
    private onDidToastHide;
    private getToastElementFromIdOrTag;
    showToast(toast: GenericHint): Promise<void>;
    showToastWithCustomIcon(hintStyle: GenericHint, icon: ScanditIcon): Promise<void>;
    hideToast(hintStyle: GenericHint): Promise<void>;
    private showGuidance;
    private hideGuidance;
    private startUpdateTimer;
    private stopUpdateTimer;
    private idFromHint;
    private onOrientationChange;
}
declare global {
    interface HTMLElementTagNameMap {
        [HintPresenter.tag]: HintPresenter;
    }
    interface HTMLElementEventMap {
        [HintPresenterEvents.Update]: CustomEvent<void>;
    }
}

interface LoadLibraryParameters {
    libraryLocation: string;
    locationPath: string;
    writableDataPathOverride?: string;
    overrideSimdSupport: OverrideState;
    overrideThreadsSupport: OverrideState;
    verifyResponseHash: boolean;
    onProgress?: (info: ProgressInfo) => void;
    referredOrigin?: string;
    fixedWasmMemory: number | null;
}
interface CreateContextParameters {
    context: DataCaptureContextJSON;
    deviceId: string;
    delayedRegistration: boolean;
    highEndBlurryRecognition: boolean;
    appName: string | null;
    parentDomain: string;
}
interface UpdateContextParameters {
    context: DataCaptureContextJSON;
    view: {
        width: number;
        height: number;
        visible: boolean;
        orientation: Orientation;
    } | null;
}
interface SetFrameSourceParameters {
    mirrorAxis: PrivateMirrorAxis;
    isCameraFrameSource: boolean;
}
type ProcessFrameParameters = FrameCapture;
interface ReportCameraPropertiesParameters {
    deviceId: string;
    hasAutofocus: boolean;
    isFrontFacing: boolean;
}
interface WorkerFunctions {
    getOffscreenCanvas: () => OffscreenCanvas | undefined;
    postMessage: (message: DataCaptureCallbackMessage, transfer?: Transferable[]) => void;
}
/**
 * DataCaptureEngine is an abstraction of the engine, it is created by the engine worker
 * and should be used as a singleton. It calls the underlying engine methods directly.
 */
declare class DataCaptureEngine<M extends Module> {
    private static get3dPartyLicenseKeyMethodName;
    context: DataCaptureContext;
    lastUsedModuleMirrorAxis: unknown;
    view: DataCaptureView | undefined;
    hintPresenterV2: HintPresenterV2 | null;
    protected readonly MAX_NUMBER_OF_IMAGES_IN_FRAME_DATA_POOL: number;
    protected readonly moduleHandler: ModuleHandler<M>;
    protected readonly redrawInterval: number;
    protected readonly redrawRequests: number[];
    protected readonly workerFunctions: WorkerFunctions;
    protected _isDrawLoopRunning: boolean;
    protected contextDeserializer: DataCaptureContextDeserializer | undefined;
    protected frameDataPool: Map<number, Uint8ClampedArray>;
    protected imageFrameSource?: DataCaptureImageBufferFrameSource;
    protected lastFrameCounter: number;
    protected libraryLoadingPromise: Promise<void> | undefined;
    protected loopTimeoutId?: ReturnType<typeof setTimeout>;
    protected resourcePath: string;
    protected writableDataPath: string;
    protected poorMansBenchmarkLogs: boolean;
    protected parentDomain: string;
    protected readonly writableDataPathStandard: string;
    protected readonly resourceFilesSubfolder: string;
    protected performanceMetricsReporterTimer: ReturnType<typeof setTimeout> | undefined;
    protected performanceMetrics: PerformanceMetrics;
    protected gestureRecognizer: GestureRecognizer | null;
    private gestureListener;
    private webPlatformHintPresenter;
    constructor(moduleHandler: ModuleHandler<M>, workerFunctions: WorkerFunctions);
    get Module(): M;
    set isDrawLoopRunning(newValue: boolean);
    get isDrawLoopRunning(): boolean;
    convertToLoadableFrameData(frameData: WasmFrameData): PrivateLoadableFrameData;
    createContext(createContextJSON: CreateContextParameters): EngineWorkerResponse<"createContext">;
    onTap(point: PointJSON): void;
    hintPresenterV2Update(): void;
    startReportingPerformanceMetrics(): void;
    reportPerformanceMetrics(): Promise<void>;
    deleteFrameData(frameId: number): void;
    dispose(): EngineWorkerResponse<"dispose">;
    flushAnalytics(): void;
    extractCentaurusLicense(scanditLicenseKey: string): EngineWorkerResponse<"extractCentaurusLicense">;
    getModeDeserializers(): Vector;
    loadLibrary(parameters: LoadLibraryParameters): EngineWorkerResponse<"loadLibrary">;
    processFrame(parameters: ProcessFrameParameters): EngineWorkerResponse<"processFrame">;
    reportCameraProperties(properties: ReportCameraPropertiesParameters): EngineWorkerResponse<"reportCameraProperties">;
    requestFrameData(frameId: number): EngineWorkerResponse<"requestFrameData">;
    scheduleRedraw(view: DataCaptureView, redrawInMs: number): void;
    sendViewRefreshCommands(commands: Uint8Array): void;
    setFrameSource(mirrorAxis: PrivateMirrorAxis, isCameraFrameSource: boolean): EngineWorkerResponse<"setFrameSource">;
    /**
     * The draw loop check at regular interval if any redraw request were made by the engine.
     * If a redraw is necessary, it gathers and sends drawing commands to the main thread.
     */
    startDrawLoop(view: DataCaptureView): void;
    updateContext(contextUpdateParameters: UpdateContextParameters): EngineWorkerResponse<"updateContext">;
    /**
     * Called before updateContextFromJson
     *
     * @protected
     * @param {UpdateContextParameters} contextUpdateParameters
     * @returns {UpdateContextParameters}
     */
    protected onBeforeUpdateContextHook(contextUpdateParameters: UpdateContextParameters): UpdateContextParameters;
    onDocumentVisibilityChange(state: DocumentVisibilityState): void;
    isFeatureSupported(feature: LicensedFeature): EngineWorkerResponse<"isFeatureSupported">;
    getViewfinderInfo(): EngineWorkerResponse<"getViewfinderInfo">;
    getOpenSourceSoftwareLicenseInfo(): EngineWorkerResponse<"getOpenSourceSoftwareLicenseInfo">;
    protected getNextFrameId(): number;
    protected getWasmDynamicLibraries(coreWasmURI: string): string[];
    protected getWasmCoreExpectedHash(simdSupport: boolean, threadsSupport: boolean): string;
    protected getWasmCoreFileName(simdSupport: boolean, threadsSupport: boolean): string;
    protected getWasmMetadata(): Record<string, {
        bytes: number;
    }>;
    protected getWasmSideModuleFileName(): string;
    private _loadProgressCallback;
    /**
     * Redraw requests are scheduled at [now + redrawInMs], so when pushed they must be sorted
     * in chronological order so that we can later easily check if we need to redraw by checking
     * the first element.
     * @param redrawInMs
     */
    private addRedrawRequest;
    private contextDidChangeStatus;
    private didStartObservingContext;
    private mapMirrorAxisOnModule;
    protected setView(view: DataCaptureView | undefined): void;
    /**
     * Add a native overlay to the view without passing from the deserializer.
     * must be implemented in the specific module.
     * @param event - The message event containing the overlay handle.
     */
    addNativeOverlay(event: MessageEvent<AnyDataCaptureActionMessage>): void;
    /**
     * Remove a native overlay from the view.
     * must be implemented in the specific module.
     * @param event - The message event containing the overlay handle.
     */
    removeNativeOverlay(event: MessageEvent<AnyDataCaptureActionMessage>): void;
    private setViewRefreshHandler;
    private setupDataDecoding;
    private start;
    private getWritableDataPath;
    private numOfMBToPages;
    private setup;
}

declare enum MeteringMode {
    CONTINUOUS = "continuous",
    MANUAL = "manual",
    NONE = "none",
    SINGLE_SHOT = "single-shot"
}
declare enum CameraResolutionConstraint {
    ULTRA_HD = 0,
    FULL_HD = 1,
    HD = 2,
    SD = 3,
    NONE = 4
}
interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
    exposureCompensation?: DoubleRange;
    exposureMode?: MeteringMode[];
    exposureTime?: DoubleRange;
    focusDistance?: DoubleRange;
    focusMode?: MeteringMode[];
    torch?: boolean;
    zoom?: DoubleRange;
}
interface ExtendedMediaTrackConstraintSet extends MediaTrackConstraintSet {
    exposureCompensation?: ConstrainDouble | number;
    exposureMode?: MeteringMode;
    exposureTime?: ConstrainDouble | number;
    focusDistance?: ConstrainDouble | number;
    focusMode?: MeteringMode;
    torch?: boolean;
    zoom?: ConstrainDouble | number;
}
interface GUI {
    isCameraRecoveryVisible: () => boolean;
    setCameraRecoveryVisible: (visible: boolean) => void;
}
interface FrameCapture {
    colorType?: ColorType;
    data: Uint8ClampedArray;
    height: number;
    width: number;
}
declare enum CameraManagerEvent {
    CAMERA_PROPERTIES = "cameraProperties",
    CAMERA_ACCESS_ERROR = "cameraAccessError"
}
type CameraManagerEventParameters<C> = C extends CameraManagerEvent.CAMERA_PROPERTIES ? ReportCameraPropertiesParameters : C extends CameraManagerEvent.CAMERA_ACCESS_ERROR ? any : never;
/**
 * A barcode picker utility class used to handle camera interaction.
 */
declare class CameraManager {
    private static readonly autofocusIntervalMs;
    private static readonly cameraAccessTimeoutMs;
    private static readonly getCapabilitiesTimeoutMs;
    private static readonly manualFocusWaitTimeoutMs;
    private static readonly manualToAutofocusResumeTimeoutMs;
    private static readonly noCameraErrorParameters;
    private static readonly notReadableErrorParameters;
    private static readonly videoMetadataCheckIntervalMs;
    private static readonly videoMetadataCheckTimeoutMs;
    private static MIRRORED_CLASS_NAME;
    private static _instance;
    activeCamera?: DeviceCamera$1;
    activeCameraSettings?: CameraSettings;
    canvas: HTMLCanvasElement;
    gui: GUI;
    selectedCamera?: DeviceCamera$1;
    videoElement: HTMLVideoElement;
    private constraint;
    private clipArea?;
    private readonly checkCameraVideoStreamAccessIfVisibleListener;
    private readonly handleWebGLContextLostListener;
    private readonly listeners;
    private readonly mirrorImageOverrides;
    private readonly postStreamInitializationListener;
    private readonly triggerFatalError;
    private readonly triggerManualFocusListener;
    private readonly triggerZoomMoveListener;
    private readonly triggerZoomStartListener;
    private readonly videoResizeListener;
    private readonly videoTrackEndedListener;
    private readonly videoTrackMuteListener;
    private _canvas2dContext;
    private _canvasWebGLContext;
    private _synchronousFrameHandling;
    private _frameReaderOptions;
    private _glFrameReaders;
    private _frameReaderType;
    private _mediaStream?;
    private abortedCameraInitializationResolveCallback?;
    private autofocusInterval;
    private cameraAccessRejectCallback?;
    private cameraAccessTimeout;
    private cameraInitializationPromise?;
    private cameraPosition;
    private cameraSetupPromise?;
    private getCapabilitiesTimeout;
    private manualFocusWaitTimeout;
    private manualToAutofocusResumeTimeout;
    private mediaTrackCapabilities?;
    private mediaTrackCapabilitiesPromise?;
    private mediaTrackCapabilitiesPromiseResolver?;
    private pinchToZoomDistance?;
    private pinchToZoomEnabled;
    private pinchToZoomInitialZoom;
    private selectedCameraSettings?;
    private tapToFocusEnabled;
    private torchEnabled;
    private torchToggleEnabled;
    private videoMetadataCheckInterval;
    private isWebGLSupported;
    private clippedFrameRequestID?;
    private isVideoStreamPaused;
    private handleVideoPauseHandler;
    constructor();
    get mediaStream(): MediaStream | undefined;
    set mediaStream(stream: MediaStream | undefined);
    get synchronousFrameHandling(): boolean;
    private get canvas2dContext();
    private get canvasWebGLContext();
    static instance(): CameraManager;
    recycle(pixelsData: Uint8ClampedArray): void;
    getCurrentFrame(): FrameCapture | undefined;
    requestVideoFrame(scheduledFunction: FrameRequestCallback | VideoFrameRequestCallback, videoElement?: HTMLVideoElement): number;
    cancelVideoFrame(id: number, videoElement?: HTMLVideoElement): void;
    addListener<E extends CameraManagerEvent>(event: CameraManagerEvent, listener: (details: CameraManagerEventParameters<E>) => void): void;
    applyCameraSettings(cameraSettings?: CameraSettings): Promise<void>;
    captureImage(): FrameCapture | null;
    initializeCameraWithSettings(camera?: DeviceCamera$1, cameraSettings?: CameraSettings): Promise<void>;
    isMirrorImageEnabled(): boolean;
    isPinchToZoomEnabled(): boolean;
    isTapToFocusEnabled(): boolean;
    isTorchAvailable(): Promise<boolean>;
    playVideo(): Promise<void>;
    reinitializeCamera(): Promise<void>;
    removeListener<E extends CameraManagerEvent>(event: CameraManagerEvent, listenerToRemove?: (details: CameraManagerEventParameters<E>) => void): void;
    setCameraPosition(cameraPosition: CameraPosition): Promise<void>;
    setExposure(exposure: {
        compensation?: number;
        time?: number;
    }): Promise<void>;
    setFocus(manualLensPosition: number): Promise<void>;
    setFrameRate(frameRate: {
        min?: number;
        max?: number;
    }): Promise<void>;
    setInitialCameraPosition(cameraPosition: CameraPosition): void;
    setInteractionOptions(torchToggleEnabled: boolean, tapToFocusEnabled: boolean, pinchToZoomEnabled: boolean): void;
    setMirrorImageEnabled(enabled: boolean, override: boolean): void;
    setPinchToZoomEnabled(enabled: boolean): void;
    setSelectedCamera(camera?: DeviceCamera$1): void;
    setSelectedCameraSettings(cameraSettings?: CameraSettings): void;
    setTapToFocusEnabled(enabled: boolean): void;
    setTorchEnabled(enabled: boolean): Promise<void>;
    setZoom(zoomFactor: number): Promise<void>;
    setupCameras(): Promise<void>;
    pauseStream(): void;
    resumeStream(): void;
    stopStream(cameraInitializationFailure?: boolean): Promise<void>;
    stopVideoTracks(): void;
    toggleTorch(): Promise<void>;
    updateCanvasVideoImage(): void;
    waitForCapabilities(): Promise<void>;
    setFrameReaderType(type: ColorType): void;
    allowPictureInPicture(allow: boolean): Promise<void>;
    setFrameHandling(synchronous: boolean): void;
    setClipArea(clipArea?: Rect): Promise<void>;
    /**
     * Converts a rectangle in DataCaptureView coordinates to camera frame coordinates.
     */
    private frameRectFromViewRect;
    private accessAutoselectedCamera;
    private getFrameReaderOptions;
    private getFrameReader;
    private accessInitialCamera;
    /**
     * When a context has been created for a canvas, it is not possible to get another one from another type.
     * This function re-creates a new canvas based on the existing one.
     */
    private recreateCanvas;
    private captureImageFor2dContext;
    private areVideoAndWebGLSizeMismatching;
    private captureImageForWebGLContext;
    private checkCameraAccess;
    private checkCameraVideoStreamAccessIfVisible;
    private checkVideoMetadata;
    private disablePinchToZoomListeners;
    private disableTapToFocusListeners;
    private emit;
    private enablePinchToZoomListeners;
    private enableTapToFocusListeners;
    private getActiveCamera;
    private getInitialCameraResolutionConstraint;
    private handleCameraInitializationError;
    private handleVideoResize;
    private handleWebGLContextLost;
    private initializeCameraAndCheckUpdatedSettings;
    private initializeCameraForResolution;
    private initializeStreamForResolution;
    private isVideoAndContextStateValid;
    private postStreamInitialization;
    private recoverStreamIfNeeded;
    private reportCameraProperties;
    private setCameraAccessTimeout;
    private setupAutofocus;
    private setupCameraStreamVideo;
    private setupCamerasAndStream;
    private storeStreamCapabilities;
    private triggerAutoFocus;
    private triggerFocusMode;
    private triggerManualFocus;
    private triggerManualFocusForContinuous;
    private triggerManualFocusForSingleShot;
    private triggerZoomMove;
    private triggerZoomStart;
    private updateActiveCameraCurrentResolution;
    private updateStreamForResolution;
    private videoTrackEndedRecovery;
    private videoTrackMuteRecovery;
    private clipMediaStreamIfNeeded;
    private drawClippedFrame;
    private cleanupClippedStream;
    connectedCallback(mountLocation: HTMLElement): void;
    disconnectedCallback(): void;
    getVideoElement(): HTMLVideoElement;
    private handleVideoPause;
}

interface CameraJSON extends FrameSourceJSON {
    type: "camera";
    position: CameraPosition;
    settings: CameraSettingsJSON | Record<string, never>;
    desiredState: FrameSourceState;
    desiredTorchState: TorchState;
}
interface VideoFrameResolution {
    readonly width: number;
    readonly height: number;
}
declare class Camera implements FrameSource, Serializable<CameraJSON> {
    readonly label: string;
    deviceId: string;
    readonly position: CameraPosition;
    private _currentResolution?;
    private readonly cameraManager;
    private readonly type;
    private readonly webGLContextLostListener;
    private _currentState;
    private _settings;
    private _desiredTorchState;
    private _desiredState;
    private readonly listeners;
    private _context;
    private _desiredMirrorImageEnabled?;
    private _lastCaptureRequestAnimationFrame?;
    private _lastCanvasVideoPreviewAnimationFrame?;
    private _isAndroidWebView?;
    private readonly stateTransitionStrategyMap;
    private currentTransitionStrategyPromise?;
    constructor(manager?: CameraManager);
    static get default(): Camera;
    get desiredState(): FrameSourceState;
    get settings(): CameraSettings;
    get currentResolution(): VideoFrameResolution | null;
    private get context();
    private set context(value);
    private get currentState();
    static atPosition(cameraPosition: CameraPosition): Camera | null;
    static fromDeviceCamera(deviceCamera: DeviceCamera): Camera;
    switchToDesiredState(state: FrameSourceState): Promise<void>;
    getDesiredTorchState(): TorchState;
    setDesiredTorchState(desiredTorchState: TorchState): Promise<void>;
    isTorchAvailable(): Promise<boolean>;
    addListener(listener: FrameSourceListener | null): void;
    removeListener(listener: FrameSourceListener | null): void;
    applySettings(settings: CameraSettings): Promise<void>;
    toJSONObject(): CameraJSON;
    getMirrorImageEnabled(): boolean;
    setMirrorImageEnabled(enabled: boolean): Promise<void>;
    getCurrentState(): FrameSourceState;
    setClipArea(area?: Rect): Promise<void>;
    private setCurrentState;
    /**
     * Starts camera according to the given position. If a deviceId is set, pre-select the corresponding camera.
     * The function returns as soon as the camera has started successfully and is active. The label and
     * position properties reflect then the values found in the accessed stream.
     */
    private setupCamera;
    private notifyContext;
    private notifyListeners;
    private updateCanvasVideoImage;
    private captureAndSend;
    /**
     * Capture images from the video stream and send them to the context. If no context is set, the function will
     * stop itself until called again. While no enabled mode is present in the context, the function will schedule itself
     * again indefinitely without doing anything else.
     */
    private startSendingCapturesToWorker;
    private stopSendingCapturesToWorker;
    private transitionFromStateOffToOn;
    private transitionFromStateOffToStandby;
    private transitionFromStateOnToOff;
    private transitionFromStateOnToStandby;
    private transitionFromStateStandbyToOff;
    private transitionFromStateStandbyToOn;
    private isAndroidWebView;
    private isZoomAvailable;
}

export { type AugmentedWorker as $, type PrivateFrameHandler as A, DataCaptureContext$1 as B, CameraPosition as C, DataCaptureLoader as D, type DataCaptureContextListener as E, FocusGestureStrategy as F, type ContextStatusJSON as G, ContextStatus as H, PrivateMirrorAxis as I, type DataCaptureOverlay as J, type DataCaptureViewListener as K, type DataCaptureViewJSON as L, type DataCaptureViewConnectOptions as M, DataCaptureView$1 as N, type FrameData as O, type PrivateChangeSet as P, type PrivateLoadableFrameData as Q, convertToPublicFrameData as R, type DataCaptureLoaderOptions as S, TorchState as T, HintPresenter as U, VideoResolution as V, type PerformanceMetrics as W, DataCaptureEngine as X, type Module as Y, type GenericHint as Z, type AnyDataCaptureActionMessage as _, type FrameSource as a, HintTextAlignment as a$, type ModuleHandler as a0, type DataCaptureCallbackMessage as a1, type DataCaptureActionMessageKey as a2, type EngineWorkerResponse as a3, type ExtractCentaurusLicenseResponse as a4, type RequestFrameDataResponse as a5, type IsFeatureSupportedResponse as a6, type GetViewfinderInfo as a7, type GetOpenSourceSoftwareLicenseInfoResponse as a8, type WorkerResponse as a9, type PerformanceMetricsReportMessage as aA, type DidTapTrackedBarcode as aB, type OnFrameProcessingStartedMessage as aC, type OnFrameProcessingFinishedMessage as aD, type OnFrameSkippedMessage as aE, type ShowToastMessage as aF, type HideToastMessage as aG, type ShowGuidanceMessage as aH, type HideGuidanceMessage as aI, type StartUpdateTimerMessage as aJ, type StopUpdateTimerMessage as aK, type PayloadForCommand as aL, type DataCaptureWorker as aM, type EmscriptenClassHandle as aN, type DataCaptureContext as aO, type DataCaptureImageBufferFrameSource as aP, type GestureListener as aQ, type GestureRecognizer as aR, type DataCaptureView as aS, type JSONParseable as aT, type DataCaptureContextDeserializerResult as aU, type DataCaptureContextDeserializer as aV, type CaptureModeDeserializerInstance as aW, type ModuleMirrorAxis as aX, type Vector as aY, type WasmFrameData as aZ, HintFont as a_, type LoadLibraryDataCaptureAction as aa, type CreateContextDataCaptureAction as ab, type SetFrameSourceDataCaptureAction as ac, type ProcessFrameDataCaptureAction as ad, type RequestFrameDataDataCaptureAction as ae, type DeleteFrameDataDataCaptureAction as af, type VisibilityChangeAction as ag, type IsFeatureSupportedAction as ah, type UpdateContextDataCaptureAction as ai, type DisposeDataCaptureAction as aj, type FlushAnalyticsDataCaptureAction as ak, type ReportCameraPropertiesDataCaptureAction as al, type SetLogLevelDataCaptureAction as am, type ExtractCentaurusLicenseDataCaptureAction as an, type OnTapAction as ao, type HintPresenterV2updateAction as ap, type GetViewfinderInfoAction as aq, type GetOpenSourceSoftwareLicenseInfoAction as ar, type AddNativeOverlayAction as as, type RemoveNativeOverlayAction as at, type DataCaptureCallbackMessageKeys as au, type SuccessFeedbackWorkerMessage as av, type ShowHintWorkerMessage as aw, type UpdateHintWorkerMessage as ax, type IsFeatureSupportedMessage as ay, type HideHintWorkerMessage as az, FrameSourceState as b, HintWidth as b0, HintHeight as b1, HintCornerStyle as b2, HintIcon as b3, HintAnchor as b4, type HintStyle as b5, GuidanceHintAnchor as b6, GuidanceHintStyle as b7, type GuidanceHint as b8, ToastHintStyle as b9, type GUI as bA, CameraManagerEvent as bB, type CameraManagerEventParameters as bC, CameraManager as bD, type ToastHint as ba, LicensedFeature as bb, type HintPresenterV2 as bc, type PlatformHintPresenter as bd, type LoadLibraryParameters as be, type CreateContextParameters as bf, type UpdateContextParameters as bg, type SetFrameSourceParameters as bh, type ProcessFrameParameters as bi, type ReportCameraPropertiesParameters as bj, type WorkerFunctions as bk, FrameReaderAbstract as bl, ColorType as bm, type PoolCapacityOptions as bn, type FrameCapture as bo, FrameReader as bp, CameraPosition$1 as bq, CameraResolutionConstraint$1 as br, AspectRatio as bs, type DeviceCamera$1 as bt, CameraAccess$1 as bu, HintPresenterEvents as bv, MeteringMode as bw, CameraResolutionConstraint as bx, type ExtendedMediaTrackCapabilities as by, type ExtendedMediaTrackConstraintSet as bz, type FrameSourceListener as c, type FrameSourceJSON as d, type CameraJSON as e, type VideoFrameResolution as f, Camera as g, CameraAccess as h, type DeviceCamera as i, type CameraSettingsJSONBase as j, type CameraSettingsFromJSON as k, type CameraSettingsJSON as l, isCameraFrameSource as m, CameraSettings as n, type Change as o, type DataCaptureMode as p, type PrivateDataCaptureMode as q, type DataCaptureModeJSON as r, type PrivateDataCaptureComponent as s, type DataCaptureComponentJSON as t, type DataCaptureComponent as u, type PrivateDataCaptureContextOptions as v, type PrivateDataCaptureContext as w, type DataCaptureContextCreationOptions as x, type DataCaptureContextJSON as y, type PrivateFrameHandlerResponse as z };
