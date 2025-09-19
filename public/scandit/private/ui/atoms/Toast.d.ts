/// <reference types="emscripten" />
import { ScanditIcon } from '../../../ScanditIcon.js';
import { ScanditHTMLElement } from '../../utils/ScanditHTMLElement.js';
import { Z as GenericHint } from '../../../Camera-C_4xOv5n.js';
import '../../../Common.js';
import '../../Serializable.js';
import '../../FrameReaders/WatermarkStack.js';
import '../../../tsHelper.js';
import '../../../DataCaptureContextSettings.js';
import '../../../DataCaptureViewPlusRelated.js';
import '../../../NotificationPresenter/NotificationPresenter.js';
import '../../../NotificationPresenter/NotificationConfiguration.js';
import '../../../NotificationPresenter/NotificationStyle.js';
import '../../../ViewControls.js';
import '../../CustomLocationsView.js';
import '../../View.js';
import '../../AnchorPositions.js';
import '../../nativeHandle.js';
import '../../../license/OpenSourceSoftwareLicenseInfo.js';
import '../../HtmlElementState.js';
import '../../../worker/OverrideState.js';
import '../../../logger.js';
import '../../../LoadingStatus.js';

declare enum ToastEvents {
    DidShow = "didshow",
    DidHide = "didhide",
    WillShow = "willshow"
}
type WillShowEvent = CustomEvent<{
    target: Toast;
}>;
type DidShowEvent = CustomEvent<{
    target: Toast;
}>;
type DidHideEvent = CustomEvent<{
    target: Toast;
}>;
declare class Toast extends ScanditHTMLElement {
    static readonly tag: "scandit-toast-hint";
    private toast;
    private _hintStyle;
    private _customIcon;
    private currentAnimation;
    private _exclamationIcon;
    private _checkIcon;
    private animationDuration;
    private _currentAnimationDirection;
    constructor();
    private static createStyleElement;
    get hintStyle(): GenericHint["hintStyle"] | null;
    set hintStyle(hintStyle: GenericHint["hintStyle"]);
    get customIcon(): ScanditIcon | null;
    set customIcon(icon: ScanditIcon | null);
    private get showAnimation();
    private get hideAnimation();
    static create(): Toast;
    static register(): void;
    show(): Promise<void>;
    hide(): Promise<void>;
    connectedCallback(): void;
    private toggle;
    private render;
}
declare global {
    interface HTMLElementTagNameMap {
        [Toast.tag]: Toast;
    }
    interface HTMLElementEventMap {
        [ToastEvents.WillShow]: WillShowEvent;
        [ToastEvents.DidShow]: DidShowEvent;
        [ToastEvents.DidHide]: DidHideEvent;
    }
}

export { type DidHideEvent, type DidShowEvent, Toast, ToastEvents, type WillShowEvent };
