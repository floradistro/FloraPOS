/// <reference types="emscripten" />
import { Size } from '../../Common.js';
import { Optional } from '../../tsHelper.js';
import '../../ScanditIcon.js';
import '../../Camera-C_4xOv5n.js';
import '../Serializable.js';
import './ScanditHTMLElement.js';
import '../FrameReaders/WatermarkStack.js';
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

type Encoding = "charset=utf-8";
type SvgMimeType = "image/svg+xml";
interface SVGData {
    data: `data:${SvgMimeType};${Encoding},${string}`;
    size: Size;
}
declare function svgToDataURL(svg: SVGElement): Promise<SVGData["data"]>;
declare const placeholderImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8";
declare function removeElementsBySelector(selector: string, element: HTMLElement): boolean;
declare function removeUnwantedHTMLElement(element: HTMLElement): boolean;
declare function replaceImages(element: HTMLElement | SVGElement, placeholder?: string): boolean;
declare function stripImagesFromViewAndWarnUser(strip: boolean, view: Optional<HTMLElement>): void;

export { type SVGData, placeholderImage, removeElementsBySelector, removeUnwantedHTMLElement, replaceImages, stripImagesFromViewAndWarnUser, svgToDataURL };
