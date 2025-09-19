/// <reference types="emscripten" />
import { PrivateCanvasDrawer } from './CanvasDrawer.js';
import '../ScanditIcon.js';
import { W as PerformanceMetrics } from '../Camera-C_4xOv5n.js';
import './CavansDrawerAbstract.js';
import './DrawCommandBuffer.js';
import '../Common.js';
import './Serializable.js';
import './utils/ScanditHTMLElement.js';
import './FrameReaders/WatermarkStack.js';
import '../tsHelper.js';
import '../DataCaptureContextSettings.js';
import '../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter/NotificationPresenter.js';
import '../NotificationPresenter/NotificationConfiguration.js';
import '../NotificationPresenter/NotificationStyle.js';
import '../ViewControls.js';
import './CustomLocationsView.js';
import './View.js';
import './AnchorPositions.js';
import './nativeHandle.js';
import '../license/OpenSourceSoftwareLicenseInfo.js';
import './HtmlElementState.js';
import '../worker/OverrideState.js';
import '../logger.js';
import '../LoadingStatus.js';

declare class PrivateCanvasDrawerWithMetrics extends PrivateCanvasDrawer {
    private drawPerformanceTimer;
    private drawPerformanceFPSCounter;
    private lastDrawPerformanceFPSCounter;
    private performanceMetrics?;
    private performanceCanvasLayer;
    private _performanceLayerContext;
    constructor(canvas: HTMLCanvasElement);
    get performanceLayerContext(): CanvasRenderingContext2D;
    setupPerformanceLayer(): void;
    setPerformanceMetrics(performanceMetrics: PerformanceMetrics): void;
    updateCanvasSizeAttributes(width: number, height: number, devicePixelRatio?: number): ReturnType<PrivateCanvasDrawer["updateCanvasSizeAttributes"]>;
    protected doDraw(): void;
    protected drawPerformanceMetrics(): void;
    protected drawFullPerformanceMetrics(): void;
}

export { PrivateCanvasDrawerWithMetrics };
