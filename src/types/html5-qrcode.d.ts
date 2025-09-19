declare module 'html5-qrcode' {
  interface Html5QrcodeCameraScanConfig {
    fps?: number;
    qrbox?: number | { width: number; height: number };
    aspectRatio?: number;
    disableFlip?: boolean;
    videoConstraints?: MediaTrackConstraints;
  }

  interface Html5QrcodeResult {
    decodedText: string;
    result: {
      format: {
        formatName: string;
      };
    };
  }

  interface Html5QrcodeError {
    message: string;
  }

  interface CameraDevice {
    id: string;
    label: string;
  }

  export class Html5Qrcode {
    constructor(elementId: string, verbose?: boolean);
    
    start(
      cameraIdOrConfig: string | { facingMode: string },
      config: Html5QrcodeCameraScanConfig,
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: Html5QrcodeError) => void
    ): Promise<void>;
    
    stop(): Promise<void>;
    clear(): void;
    getState(): number;
    
    static getCameras(): Promise<CameraDevice[]>;
  }

  export class Html5QrcodeScanner {
    constructor(
      elementId: string,
      config: Html5QrcodeCameraScanConfig,
      verbose?: boolean
    );
    
    render(
      qrCodeSuccessCallback: (decodedText: string, result: Html5QrcodeResult) => void,
      qrCodeErrorCallback?: (errorMessage: string, error: Html5QrcodeError) => void
    ): void;
    
    clear(): void;
  }
}
