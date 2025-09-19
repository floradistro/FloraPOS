/// <reference types="emscripten" />
import { N as DataCaptureView, a as FrameSource, B as DataCaptureContext } from '../Camera-C_4xOv5n.js';
import { Control, TorchSwitchControl, CameraSwitchControl, CameraFOVSwitchControl } from '../ViewControls.js';
import './Serializable.js';
import '../Common.js';
import './FrameReaders/WatermarkStack.js';
import '../tsHelper.js';
import '../ScanditIcon.js';
import './utils/ScanditHTMLElement.js';
import '../DataCaptureContextSettings.js';
import '../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter/NotificationPresenter.js';
import '../NotificationPresenter/NotificationConfiguration.js';
import '../NotificationPresenter/NotificationStyle.js';
import './CustomLocationsView.js';
import './View.js';
import './AnchorPositions.js';
import './nativeHandle.js';
import '../license/OpenSourceSoftwareLicenseInfo.js';
import './HtmlElementState.js';
import '../worker/OverrideState.js';
import '../logger.js';
import '../LoadingStatus.js';

interface PrivateControl {
    type: "camera-fov" | "camera" | "torch";
    view: DataCaptureView | null;
}
interface TorchSwitchControlIcon {
    on: {
        idle: string | null;
        pressed: string | null;
    };
    off: {
        idle: string | null;
        pressed: string | null;
    };
}
interface CameraSwitchControlIcon {
    idle: string | null;
    pressed: string | null;
}
interface CameraFOVSwitchControlIcon {
    wide: {
        idle: string | null;
        pressed: string | null;
    };
    ultraWide: {
        idle: string | null;
        pressed: string | null;
    };
}
interface PrivateControlWidget {
    install: () => Promise<boolean>;
    remove: (definitiveRemoval?: boolean) => void;
}
declare enum ButtonState {
    Idle = "idle",
    Pressed = "pressed"
}
declare abstract class ButtonControlWidget<C extends Control> {
    protected domHost: HTMLElement;
    protected state: ButtonState;
    protected button: HTMLButtonElement | undefined;
    protected isHover: boolean;
    protected onTouchStartListener: (event?: Event) => void;
    protected onMouseEnterListener: (event?: Event) => void;
    protected onMouseLeaveListener: (event?: Event) => void;
    protected onClickListener: (event?: Event) => void;
    protected control: C;
    private controlTypeToAriaLabelMap;
    constructor(control: C, domHost: HTMLElement);
    protected get frameSource(): FrameSource | null | undefined;
    protected get context(): DataCaptureContext | null | undefined;
    install(): Promise<boolean>;
    remove(definitiveRemoval?: boolean): void;
    protected hide(): void;
    protected show(): void;
    protected setupButton(): HTMLButtonElement;
    protected setup(): void;
    private onTouchStart;
    private onMouseEnter;
    private onMouseLeave;
    private onClick;
    private updateButtonBackground;
    protected abstract getImageFromState(): string | null;
    protected abstract buttonClicked(): Promise<void>;
    protected abstract canShow(): Promise<boolean>;
}
declare class PrivateTorchControlWidget extends ButtonControlWidget<TorchSwitchControl> implements PrivateControlWidget {
    constructor(control: TorchSwitchControl, domHost: HTMLElement);
    protected buttonClicked(): Promise<void>;
    protected canShow(): Promise<boolean>;
    protected getImageFromState(): string | null;
    protected setup(): void;
    private isTorchAvailable;
    private retrieveTorchState;
}
declare class CameraSwitchControlWidget extends ButtonControlWidget<CameraSwitchControl> implements PrivateControlWidget {
    private isTransitioning;
    constructor(control: CameraSwitchControl, domHost: HTMLElement);
    private static get CameraAccess();
    private static get Camera();
    protected canShow(): Promise<boolean>;
    protected getImageFromState(): string | null;
    protected buttonClicked(): Promise<void>;
    protected setup(): void;
    private getNextDeviceCamera;
    private switchCameras;
}
declare class PrivateCameraFOVSwitchControlWidget extends ButtonControlWidget<CameraFOVSwitchControl> implements PrivateControlWidget {
    private isTransitioning;
    constructor(control: CameraFOVSwitchControl, domHost: HTMLElement);
    private static get Camera();
    private static get CameraAccess();
    install(): Promise<boolean>;
    protected canShow(): Promise<boolean>;
    protected getImageFromState(): string | null;
    protected buttonClicked(): Promise<void>;
    protected setup(): void;
    private setInitialCamera;
    private isUltraWideBackCamera;
    private getAlternativeDeviceCamera;
    private switchCameras;
}

export { ButtonState, type CameraFOVSwitchControlIcon, type CameraSwitchControlIcon, CameraSwitchControlWidget, PrivateCameraFOVSwitchControlWidget, type PrivateControl, type PrivateControlWidget, PrivateTorchControlWidget, type TorchSwitchControlIcon };
