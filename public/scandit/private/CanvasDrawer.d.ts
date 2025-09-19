/// <reference types="emscripten" />
import { CanvasDrawerAbstract } from './CavansDrawerAbstract.js';
import './DrawCommandBuffer.js';

declare enum PathWinding {
    Nonzero = "nonzero",
    Evenodd = "evenodd"
}
declare class PrivateCanvasDrawer extends CanvasDrawerAbstract {
    private static ResizeObserver;
    protected readonly canvas: HTMLCanvasElement;
    private _context;
    private resizeObserver?;
    private isNextDrawPending;
    private latestCommands;
    private readonly doDrawLoop;
    constructor(canvas: HTMLCanvasElement);
    get context(): CanvasRenderingContext2D;
    /**
     * Draw given commands. If the canvas has not a valid size, postpone drawing until it is.
     */
    draw(commands: Uint8Array): void;
    updateCanvasSizeAttributes(width: number, height: number, devicePixelRatio?: number): void;
    /**
     * Observe the canvas until it has a valid size. When it happens,
     * draw postponed commands onto it.
     * Also on canvas resize, scale the context by device pixel ratio.
     */
    startObservingCanvasResize(): void;
    endObservingCanvasResize(): void;
    protected doDraw(): void;
    private postponeDraw;
    private isCanvasReady;
}

export { PathWinding, PrivateCanvasDrawer };
