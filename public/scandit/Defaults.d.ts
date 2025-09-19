/// <reference types="emscripten" />
import * as CSS from 'csstype';
import { V as VideoResolution, F as FocusGestureStrategy, C as CameraPosition } from './Camera-C_4xOv5n.js';
import { MarginsWithUnit, PointWithUnit, Anchor, Color } from './Common.js';
import { FocusGestureJSON, FocusGesture, ZoomGestureJSON, ZoomGesture, LogoStyle } from './DataCaptureViewPlusRelated.js';
import { PrivateLaserlineViewfinderDefault, RectangularViewfinderStyle, PrivateRectangularViewfinderDefault } from './ViewfinderPlusRelated.js';
import './private/Serializable.js';
import './private/FrameReaders/WatermarkStack.js';
import './tsHelper.js';
import './ScanditIcon.js';
import './private/utils/ScanditHTMLElement.js';
import './DataCaptureContextSettings.js';
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

declare class PrivateFocusGestureDeserializer {
    static fromJSON(json: FocusGestureJSON | null): FocusGesture | null;
}
declare class PrivateZoomGestureDeserializer {
    static fromJSON(json: ZoomGestureJSON | null): ZoomGesture | null;
}
interface CameraSettingsDefaults {
    preferredResolution: VideoResolution;
    zoomFactor: number;
    zoomGestureZoomFactor: number;
    focusGestureStrategy: FocusGestureStrategy;
}
interface SingleImageUploaderSettingsDefaults {
    iconElement: HTMLElement | SVGElement;
    informationElement: HTMLElement;
    buttonElement: HTMLElement;
    containerStyle: CSS.Properties;
    iconStyle: CSS.Properties;
    informationStyle: CSS.Properties;
    buttonStyle: CSS.Properties;
    onlyCameraCapture: boolean;
}
interface Defaults {
    Camera: {
        Settings: CameraSettingsDefaults;
        defaultPosition: CameraPosition | null;
        availablePositions: CameraPosition[];
    };
    SingleImageUploader: {
        Settings: SingleImageUploaderSettingsDefaults;
    };
    DataCaptureView: {
        scanAreaMargins: MarginsWithUnit;
        pointOfInterest: PointWithUnit;
        logoStyle: LogoStyle;
        logoAnchor: Anchor;
        logoOffset: PointWithUnit;
        focusGesture: FocusGesture | null;
        zoomGesture: ZoomGesture | null;
        cameraRecoveryText: string;
    };
    LaserlineViewfinder: PrivateLaserlineViewfinderDefault;
    RectangularViewfinder: {
        defaultStyle: RectangularViewfinderStyle;
        styles: Record<string, PrivateRectangularViewfinderDefault>;
    };
    AimerViewfinder: {
        frameColor: Color;
        dotColor: Color;
    };
    Brush: {
        fillColor: Color;
        strokeColor: Color;
        strokeWidth: number;
    };
    Feedback: {
        defaultVibrationPattern: number[];
    };
}
interface CameraSettingsDefaultsJSON {
    preferredResolution: string;
    zoomFactor: number;
    zoomGestureZoomFactor: number;
    focusGestureStrategy: string;
}
interface SingleImageUploaderSettingsDefaultsJSON {
    iconElement: string;
    informationElement: string;
    buttonElement: string;
    containerStyle: Record<string, number | string>;
    iconStyle: Record<string, number | string>;
    informationStyle: Record<string, number | string>;
    buttonStyle: Record<string, number | string>;
    onlyCameraCapture: boolean;
}
interface LaserlineViewfinderDefaultJSON {
    width: string;
    enabledColor: string;
    disabledColor: string;
}
interface RectangularViewfinderDefaultJSON {
    size: string;
    color: string;
    style: string;
    lineStyle: string;
    dimming: number;
    animation: string;
}
interface DefaultsJSON {
    Camera: {
        Settings: CameraSettingsDefaultsJSON;
        defaultPosition: string | null;
        availablePositions: string[];
    };
    SingleImageUploader: {
        Settings: SingleImageUploaderSettingsDefaultsJSON;
    };
    DataCaptureView: {
        scanAreaMargins: string;
        pointOfInterest: string;
        logoAnchor: string;
        logoOffset: string;
        logoStyle: string;
        focusGesture: string;
        zoomGesture: string;
        cameraRecoveryText: string;
    };
    LaserlineViewfinder: LaserlineViewfinderDefaultJSON;
    RectangularViewfinder: {
        defaultStyle: string;
        styles: Record<string, RectangularViewfinderDefaultJSON>;
    };
    AimerViewfinder: {
        frameColor: string;
        dotColor: string;
    };
    Brush: {
        fillColor: string;
        strokeColor: string;
        strokeWidth: number;
    };
    Feedback: {
        defaultVibrationPattern: number[];
    };
}
declare function defaultsFromJSON(json: DefaultsJSON): Defaults;
declare let defaultValues: Defaults;
declare function setDefaults(newDefaults: Defaults): void;

export { type CameraSettingsDefaults, type CameraSettingsDefaultsJSON, type Defaults, type DefaultsJSON, PrivateFocusGestureDeserializer, PrivateZoomGestureDeserializer, type SingleImageUploaderSettingsDefaults, type SingleImageUploaderSettingsDefaultsJSON, defaultValues, defaultsFromJSON, setDefaults };
