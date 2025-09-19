/// <reference types="emscripten" />
import { Serializable } from './private/Serializable.js';

type ControlType = "camera-fov" | "camera" | "shutter" | "torch";
interface SerializedControl {
    type: ControlType;
}
interface Control extends Serializable {
    toJSONObject: () => SerializedControl;
}
declare class PrivateBaseControl {
    protected type: ControlType;
    toJSONObject(): SerializedControl;
}
declare class TorchSwitchControl extends PrivateBaseControl implements Control {
    static readonly CLASS_NAME: string;
    protected readonly type: ControlType;
    private view;
    private readonly icon;
    get torchOffImage(): string | null;
    set torchOffImage(torchOffImage: string | null);
    get torchOffPressedImage(): string | null;
    set torchOffPressedImage(torchOffPressedImage: string | null);
    get torchOnImage(): string | null;
    set torchOnImage(torchOnImage: string | null);
    get torchOnPressedImage(): string | null;
    set torchOnPressedImage(torchOnPressedImage: string | null);
}
declare class CameraSwitchControl extends PrivateBaseControl implements Control {
    static readonly CLASS_NAME: string;
    protected readonly type: ControlType;
    private view;
    private readonly icon;
    get idleImage(): string | null;
    set idleImage(idleImage: string | null);
    get pressedImage(): string | null;
    set pressedImage(pressedImage: string | null);
}
declare class CameraFOVSwitchControl extends PrivateBaseControl implements Control {
    static readonly CLASS_NAME: string;
    protected readonly type: ControlType;
    private view;
    private readonly icon;
    get cameraFOVUltraWideImage(): string | null;
    set cameraFOVUltraWideImage(cameraFOVUltraWideImage: string | null);
    get cameraFOVUltraWidePressedImage(): string | null;
    set cameraFOVUltraWidePressedImage(cameraFOVUltraWidePressedImage: string | null);
    get cameraFOVWideImage(): string | null;
    set cameraFOVWideImage(cameraFOVWideImage: string | null);
    get cameraFOVWidePressedImage(): string | null;
    set cameraFOVWidePressedImage(cameraFOVWidePressedImage: string | null);
}

export { CameraFOVSwitchControl, CameraSwitchControl, type Control, TorchSwitchControl };
