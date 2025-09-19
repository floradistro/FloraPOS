declare module '@zxing/library' {
  export class BrowserPDF417Reader {
    constructor();
    decodeFromImageElement(imageElement: HTMLImageElement): Promise<Result>;
    decodeFromVideoElement(videoElement: HTMLVideoElement): Promise<Result>;
    decodeFromCanvas(canvas: HTMLCanvasElement): Promise<Result>;
  }

  export class BrowserMultiFormatReader {
    constructor();
    decodeFromVideoDevice(deviceId?: string, videoElement?: HTMLVideoElement): Promise<Result>;
    decodeFromImageElement(imageElement: HTMLImageElement): Promise<Result>;
    decodeFromCanvas(canvas: HTMLCanvasElement): Promise<Result>;
    reset(): void;
    getVideoInputDevices(): Promise<MediaDeviceInfo[]>;
  }

  export class BrowserCodeReader {
    constructor();
    decodeFromVideoDevice(deviceId?: string, videoElement?: HTMLVideoElement): Promise<Result>;
    reset(): void;
  }

  export interface Result {
    text: string;
    format: BarcodeFormat;
    timestamp: number;
  }

  export enum BarcodeFormat {
    AZTEC = 'AZTEC',
    CODABAR = 'CODABAR',
    CODE_39 = 'CODE_39',
    CODE_93 = 'CODE_93',
    CODE_128 = 'CODE_128',
    DATA_MATRIX = 'DATA_MATRIX',
    EAN_8 = 'EAN_8',
    EAN_13 = 'EAN_13',
    ITF = 'ITF',
    MAXICODE = 'MAXICODE',
    PDF_417 = 'PDF_417',
    QR_CODE = 'QR_CODE',
    RSS_14 = 'RSS_14',
    RSS_EXPANDED = 'RSS_EXPANDED',
    UPC_A = 'UPC_A',
    UPC_E = 'UPC_E',
    UPC_EAN_EXTENSION = 'UPC_EAN_EXTENSION'
  }
}
