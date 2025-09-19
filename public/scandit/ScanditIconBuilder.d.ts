/// <reference types="emscripten" />
import { Color } from './Common.js';
import { SvgIcon } from './private/ui/atoms/SvgIcon.js';
import { ScanditIconShape, ScanditIcon } from './ScanditIcon.js';
import './private/Serializable.js';
import './private/utils/ScanditHTMLElement.js';

declare enum ScanditIconType {
    ChevronRight = "chevronRight",
    ChevronLeft = "chevronLeft",
    ChevronDown = "chevronDown",
    ChevronUp = "chevronUp",
    ArrowUp = "arrowUp",
    ArrowRight = "arrowRight",
    ArrowDown = "arrowDown",
    ArrowLeft = "arrowLeft",
    Checkmark = "checkMark",
    XMark = "xMark",
    QuestionMark = "questionMark",
    ExclamationMark = "exclamationMark",
    LowStock = "lowStock",
    ExpiredItem = "expiredItem",
    ToPick = "toPick",
    InspectItem = "inspectItem",
    WrongItem = "wrongItem",
    FragileItem = "fragileItem",
    StarOutlined = "starOutlined",
    StarFilled = "starFilled",
    StarHalfFilled = "starHalfFilled",
    Print = "print",
    CameraSwitch = "cameraSwitch",
    DotFiveX = "dotFiveX",
    OneX = "oneX",
    TwoX = "twoX",
    Restart = "restart",
    Keyboard = "keyboard"
}
declare const ScanditIconForIconType: Record<ScanditIconType, Promise<{
    register(): void;
    create(): SvgIcon;
}>>;
declare class ScanditIconBuilder {
    private iconName;
    private backgroundShape;
    private backgroundStrokeColor;
    private iconColor;
    private backgroundStrokeWidth;
    private backgroundColor;
    private width;
    private height;
    private iconSize;
    constructor();
    withIcon(icon: ScanditIconType): ScanditIconBuilder;
    withBackgroundShape(backgroundShape: ScanditIconShape | null): ScanditIconBuilder;
    withIconColor(color: Color): ScanditIconBuilder;
    withBackgroundColor(color: Color): ScanditIconBuilder;
    withBackgroundStrokeColor(backgroundStrokeColor: Color): ScanditIconBuilder;
    withBackgroundStrokeWidth(backgroundStrokeWidth: number): ScanditIconBuilder;
    build(): Promise<ScanditIcon>;
    withIconSize(iconSize: number): ScanditIconBuilder;
    withWidth(width: number): ScanditIconBuilder;
    withHeight(height: number): ScanditIconBuilder;
}

export { ScanditIconBuilder, ScanditIconForIconType, ScanditIconShape, ScanditIconType };
