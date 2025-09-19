/// <reference types="emscripten" />
import { bl as FrameReaderAbstract, bm as ColorType, bn as PoolCapacityOptions, bo as FrameCapture } from '../../Camera-C_4xOv5n.js';
import { WatermarkStack } from './WatermarkStack.js';
import { Optional } from '../../tsHelper.js';
import '../Serializable.js';
import '../../Common.js';
import '../../ScanditIcon.js';
import '../utils/ScanditHTMLElement.js';
import '../../DataCaptureContextSettings.js';
import '../../DataCaptureViewPlusRelated.js';
import '../../NotificationPresenter/NotificationPresenter.js';
import '../../NotificationPresenter/NotificationConfiguration.js';
import '../../NotificationPresenter/NotificationStyle.js';
import '../../ViewControls.js';
import '../CustomLocationsView.js';
import '../View.js';
import '../AnchorPositions.js';
import '../nativeHandle.js';
import '../../license/OpenSourceSoftwareLicenseInfo.js';
import '../HtmlElementState.js';
import '../../worker/OverrideState.js';
import '../../logger.js';
import '../../LoadingStatus.js';

declare class GrayScaleFrameReader extends FrameReaderAbstract {
    colorType: ColorType;
    protected _framePool: Optional<WatermarkStack<Uint8ClampedArray>>;
    private _shaderProgram;
    private _canvas;
    private _ctx;
    private _positionBuffer;
    private _texture;
    private _frameSize;
    /**
     * When these vertices are connected, they form a full-screen quad that covers the entire viewport.
     * This quad is used as the rendering target for the grayscale effect.
     * The vertices are specified in normalized device coordinates, where (-1, -1) is the bottom-left corner of the viewport, and (1, 1) is the top-right corner.
     * These positions are used in conjunction with the vertex and fragment shaders to apply the grayscale effect to the input RGBA frame across the entire screen.
     * The transformation is performed on each pixel within these triangles using the shaders.
     * https://www.khronos.org/opengl/wiki/Primitive#Triangle_primitives
     */
    private _positions;
    constructor(originalGLContext: WebGLRenderingContext, options?: PoolCapacityOptions | undefined);
    private get _webglContext();
    readFromSource(source: TexImageSource): FrameCapture;
    setup(): void;
    dispose(): void;
    private updateCanvasSizeIfNeeded;
    private updateFrameSizeIfNeeded;
    private initShaderProgram;
    private initBuffers;
    private initTexture;
}

export { GrayScaleFrameReader };
