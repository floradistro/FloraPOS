/// <reference types="emscripten" />
import { X as DataCaptureEngine, Y as Module, _ as AnyDataCaptureActionMessage, $ as AugmentedWorker, a0 as ModuleHandler, a1 as DataCaptureCallbackMessage, a2 as DataCaptureActionMessageKey, a3 as EngineWorkerResponse } from '../Camera-C_4xOv5n.js';
import '../private/Serializable.js';
import '../Common.js';
import '../private/FrameReaders/WatermarkStack.js';
import '../tsHelper.js';
import '../ScanditIcon.js';
import '../private/utils/ScanditHTMLElement.js';
import '../DataCaptureContextSettings.js';
import '../DataCaptureViewPlusRelated.js';
import '../NotificationPresenter/NotificationPresenter.js';
import '../NotificationPresenter/NotificationConfiguration.js';
import '../NotificationPresenter/NotificationStyle.js';
import '../ViewControls.js';
import '../private/CustomLocationsView.js';
import '../private/View.js';
import '../private/AnchorPositions.js';
import '../private/nativeHandle.js';
import '../license/OpenSourceSoftwareLicenseInfo.js';
import '../private/HtmlElementState.js';
import './OverrideState.js';
import '../logger.js';
import '../LoadingStatus.js';

declare class WorkerMain<E extends DataCaptureEngine<M>, M extends Module> {
    dataCaptureInstance: E;
    onMessageListener: (event: MessageEvent<AnyDataCaptureActionMessage>) => boolean;
    private readonly workerSelf;
    constructor(workerSelf: AugmentedWorker<M>, module: ModuleHandler<M>);
    listenToMessages(): void;
    postMessage(message: DataCaptureCallbackMessage, transfer?: Transferable[]): void;
    getOffscreenCanvas(): OffscreenCanvas | undefined;
    hasPayload(result: unknown): result is {
        payload: unknown;
    };
    hasTransferables(result: unknown): result is {
        transferables: Transferable[];
    };
    respondWith<C extends DataCaptureActionMessageKey>(command: C, requestId: number, executor: () => EngineWorkerResponse<C>): Promise<void>;
    /**
     * Messages received from the main thread (actions to undertake)
     */
    onMessage(event: MessageEvent<AnyDataCaptureActionMessage>): boolean;
}

export { WorkerMain };
