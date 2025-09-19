/// <reference types="emscripten" />
import { DrawCommandEnum, DrawCommandBuffer } from './DrawCommandBuffer.js';

declare enum PathWinding {
    Nonzero = "nonzero",
    Evenodd = "evenodd"
}
declare abstract class CanvasDrawerAbstract {
    protected pathWinding: PathWinding;
    protected abstract context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    protected abstract draw(commands: Uint8Array): void;
    protected drawSingleCommand(commandType: DrawCommandEnum, commandBuffer: DrawCommandBuffer): void;
    private beginPath;
    private closePath;
    private setStrokeColor;
    private setFillColor;
    private fill;
    private stroke;
    private addLine;
    private lineTo;
    private moveTo;
    private addRectangle;
    private addRoundedRectangle;
    private setStrokeWidth;
    private addArc;
    private addCircle;
    private bezierTo;
    private saveState;
    private restoreState;
    private translate;
    private transform;
    private scale;
    private addPathWinding;
    private colorToRgbaString;
}

export { CanvasDrawerAbstract, PathWinding };
