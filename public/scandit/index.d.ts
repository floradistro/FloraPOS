/// <reference types="emscripten" />
import { Logger } from './logger.js';
import { ConfigurePhase } from './sdk.js';
export { WorkerMain } from './worker/WorkerMain.js';
export { Anchor, Color, ColorJSON, Direction, JSONType, MarginsWithUnit, MarginsWithUnitJSON, MeasureUnit, NumberWithUnit, NumberWithUnitJSON, Orientation, Point, PointJSON, PointWithUnit, PointWithUnitJSON, Quadrilateral, QuadrilateralJSON, Rect, RectJSON, RectWithUnit, RectWithUnitJSON, Size, SizeJSON, SizeWithAspect, SizeWithUnit, SizeWithUnitAndAspect, SizeWithUnitAndAspectJSON, SizeWithUnitJSON, SizingMode } from './Common.js';
export { OverrideState } from './worker/OverrideState.js';
import { D as DataCaptureLoader } from './Camera-C_4xOv5n.js';
export { g as Camera, h as CameraAccess, e as CameraJSON, C as CameraPosition, n as CameraSettings, k as CameraSettingsFromJSON, l as CameraSettingsJSON, j as CameraSettingsJSONBase, o as Change, H as ContextStatus, G as ContextStatusJSON, u as DataCaptureComponent, t as DataCaptureComponentJSON, B as DataCaptureContext, x as DataCaptureContextCreationOptions, y as DataCaptureContextJSON, E as DataCaptureContextListener, S as DataCaptureLoaderOptions, p as DataCaptureMode, r as DataCaptureModeJSON, J as DataCaptureOverlay, N as DataCaptureView, M as DataCaptureViewConnectOptions, L as DataCaptureViewJSON, K as DataCaptureViewListener, i as DeviceCamera, F as FocusGestureStrategy, O as FrameData, a as FrameSource, d as FrameSourceJSON, c as FrameSourceListener, b as FrameSourceState, P as PrivateChangeSet, s as PrivateDataCaptureComponent, w as PrivateDataCaptureContext, v as PrivateDataCaptureContextOptions, q as PrivateDataCaptureMode, A as PrivateFrameHandler, z as PrivateFrameHandlerResponse, Q as PrivateLoadableFrameData, I as PrivateMirrorAxis, T as TorchState, f as VideoFrameResolution, V as VideoResolution, R as convertToPublicFrameData, m as isCameraFrameSource } from './Camera-C_4xOv5n.js';
export { LoadingStatus, LoadingStatusSubscriber, ProgressInfo, default as loadingStatus } from './LoadingStatus.js';
export { DeepMutable, DeepPartial, DistributiveKeyOf, MethodSignature, Mutable, Optional, Prettify, assert, assertUnreachable, assertUnreachableThrowException } from './tsHelper.js';
export { AimerViewfinder } from './AimerViewfinder.js';
export { Brush, BrushJSON } from './Brush.js';
export { DataCaptureContextSettings, DataCaptureContextSettingsJSON } from './DataCaptureContextSettings.js';
export { DataCaptureError, DataCaptureErrorDetails } from './DataCaptureError.js';
export { DataCaptureVersion } from './DataCaptureVersion.js';
export { FocusGesture, FocusGestureJSON, LogoStyle, SwipeToZoom, TapToFocus, ZoomGesture, ZoomGestureJSON } from './DataCaptureViewPlusRelated.js';
export { Feedback, FeedbackJSON } from './Feedback.js';
export { ImageFrameSource, ImageFrameSourceJSON } from './ImageFrameSource.js';
export { LaserlineViewfinder } from './LaserlineViewfinder.js';
export { Localization, LocalizationSubscriber, LocalizationSubscription } from './Localization.js';
export { LocationSelection, LocationSelectionJSON, PrivateNoneLocationSelection, RadiusLocationSelection, RectangularLocationSelection } from './LocationSelection.js';
export { NotificationBuilder } from './NotificationPresenter/NotificationBuilder.js';
export { NotificationConfiguration } from './NotificationPresenter/NotificationConfiguration.js';
export { NotificationPresenter } from './NotificationPresenter/NotificationPresenter.js';
export { NotificationStyle } from './NotificationPresenter/NotificationStyle.js';
export { RectangularViewfinder } from './RectangularViewfinder.js';
export { ScanditIcon, ScanditIconShape } from './ScanditIcon.js';
export { ScanditIconBuilder, ScanditIconForIconType, ScanditIconType } from './ScanditIconBuilder.js';
export { SingleImageUploader, SingleImageUploaderJSON, SingleImageUploaderType } from './SingleImageUploader.js';
export { SingleImageUploaderSettings, SingleImageUploaderSettingsJSON } from './SingleImageUploaderSettings.js';
export { Sound } from './Sound.js';
export { Vibration } from './Vibration.js';
export { CameraFOVSwitchControl, CameraSwitchControl, Control, TorchSwitchControl } from './ViewControls.js';
export { NoViewfinder, Viewfinder } from './Viewfinder.js';
export { AimerViewfinderJSON, LaserlineViewfinderJSON, PrivateLaserlineViewfinderDefault, PrivateRectangularViewfinderAnimation, PrivateRectangularViewfinderDefault, RectangularViewfinderAnimation, RectangularViewfinderJSON, RectangularViewfinderLineStyle, RectangularViewfinderStyle, ViewfinderJSON, ViewfinderType, ViewfinderTypeAimer, ViewfinderTypeLaserLine, ViewfinderTypeNone, ViewfinderTypeRectangular, ViewfinderTypeTargetAimer } from './ViewfinderPlusRelated.js';
export { BrowserCompatibility, Feature } from './browserCompatibility.js';
export { BrowserHelper } from './browserHelper.js';
export { AnchorPositions, AnchorPositionsJSON } from './private/AnchorPositions.js';
export { ScanditHTMLElement } from './private/utils/ScanditHTMLElement.js';
export { Translations } from './translations.js';
import './private/Serializable.js';
import './private/FrameReaders/WatermarkStack.js';
import './private/CustomLocationsView.js';
import './private/View.js';
import './private/nativeHandle.js';
import './license/OpenSourceSoftwareLicenseInfo.js';
import './private/HtmlElementState.js';
import './private/ui/atoms/SvgIcon.js';
import 'csstype';

type PrivateCaptureModuleName = "BarcodeCapture" | "IdCapture" | "Parser" | "LabelCapture";
interface ModuleLoader {
    moduleName: string;
    load(options: ConfigureOptions): Promise<any>;
}
interface ConfigureOptions {
    licenseKey: string;
    libraryLocation: string;
    moduleLoaders: ModuleLoader[];
    logLevel?: Logger.Level;
    licenseDataPath?: string;
}
/**
 * @hidden
 *
 * Used by tests.
 */
declare function resetConfigure(): Promise<void>;
declare function configure(options: ConfigureOptions): Promise<void>;
/**
 * @hidden
 * Used by tests.
 */
declare function __setConfigurePhase(phase: ConfigurePhase, newLoader?: DataCaptureLoader): void;

export { type ConfigureOptions, DataCaptureLoader, Logger, type ModuleLoader, type PrivateCaptureModuleName, __setConfigurePhase, configure, resetConfigure };
