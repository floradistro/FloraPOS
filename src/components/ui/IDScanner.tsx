'use client';

import React, { useState, useRef, useEffect } from 'react';
import { parse } from '@digitalbazaar/aamva-parse';

export interface IDScanResult {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNumber?: string;
  expirationDate?: string;
  issuerState?: string;
}

interface IDScannerProps {
  onScanResult: (result: IDScanResult) => void;
  onCancel: () => void;
  isScanning?: boolean;
}

export function IDScanner({ onScanResult, onCancel }: IDScannerProps) {
  const [scanText, setScanText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Ready');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setIsProcessing(true);
      setScanStatus('Starting camera...');
      setError(null);
      
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get camera stream with high quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          facingMode: 'environment'
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        
        // Wait for video to be ready
        await new Promise((resolve) => {
          const checkReady = () => {
            if (videoRef.current && videoRef.current.videoWidth > 0) {
              resolve(undefined);
            } else {
              setTimeout(checkReady, 100);
            }
          };
          checkReady();
        });
        
        setIsCameraActive(true);
        setScanStatus('Camera ready - scanning...');
        startScanning();
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError(`Camera failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setScanStatus('Camera error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Start barcode scanning
  const startScanning = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    // Use native BarcodeDetector if available (Chrome/Edge)
    if ('BarcodeDetector' in window) {
      console.log('Using native BarcodeDetector API');
      startNativeScanning();
    } else {
      console.log('Using ZXing library fallback');
      startZXingScanning();
    }
  };

  // Native browser barcode detection
  const startNativeScanning = async () => {
    try {
      // @ts-ignore - BarcodeDetector is experimental
      const barcodeDetector = new BarcodeDetector({
        formats: ['pdf417', 'code_128', 'code_39', 'qr_code']
      });
      
      const scanFrame = async () => {
        if (!videoRef.current || !isCameraActive) return;
        
        try {
          // @ts-ignore
          const barcodes = await barcodeDetector.detect(videoRef.current);
          
          if (barcodes.length > 0) {
            const barcode = barcodes[0];
            console.log('Native detector found:', barcode.format, barcode.rawValue);
            setScanStatus(`Detected ${barcode.format}!`);
            handleBarcodeDetected(barcode.rawValue);
            return;
          }
          
          setScanStatus('Scanning for barcodes...');
        } catch (e) {
          console.log('Native scan frame error:', e);
        }
      };
      
      scanInterval.current = setInterval(scanFrame, 200);
    } catch (e) {
      console.error('Native detector failed:', e);
      startZXingScanning();
    }
  };

  // ZXing library scanning
  const startZXingScanning = async () => {
    try {
      const { BrowserPDF417Reader, BrowserMultiFormatReader } = await import('@zxing/library');
      
      const pdf417Reader = new BrowserPDF417Reader();
      const multiReader = new BrowserMultiFormatReader();
      
      const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current || !isCameraActive) return;
        
        try {
          // Capture current frame
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0);
          
          // Try PDF417 first (most government IDs)
          try {
            const result = await pdf417Reader.decodeFromCanvas(canvas);
            if (result && result.text) {
              console.log('ZXing PDF417 detected:', result.text.substring(0, 50));
              setScanStatus('PDF417 detected!');
              handleBarcodeDetected(result.text);
              return;
            }
          } catch (e) {
            // Continue to next method
          }
          
          // Try multi-format reader
          try {
            const result = await multiReader.decodeFromCanvas(canvas);
            if (result && result.text) {
              console.log('ZXing multi-format detected:', result.format, result.text.substring(0, 50));
              setScanStatus(`${result.format} detected!`);
              handleBarcodeDetected(result.text);
              return;
            }
          } catch (e) {
            // Continue scanning
          }
          
          setScanStatus('Scanning...');
        } catch (e) {
          console.log('ZXing scan error:', e);
        }
      };
      
      scanInterval.current = setInterval(scanFrame, 300);
    } catch (e) {
      console.error('ZXing import failed:', e);
      setError('Barcode scanning library failed to load');
    }
  };

  // Handle detected barcode
  const handleBarcodeDetected = (barcodeText: string) => {
    console.log('Barcode detected:', barcodeText);
    stopCamera();
    setScanText(barcodeText);
    handleScan(barcodeText);
  };

  // Stop camera and scanning
  const stopCamera = () => {
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraActive(false);
    setScanStatus('Stopped');
  };

  // Process scanned data
  const handleScan = async (barcodeData?: string) => {
    const dataToProcess = barcodeData || scanText.trim();
    
    if (!dataToProcess) {
      setError('Please scan a barcode or enter the data manually');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setScanStatus('Processing...');

    try {
      // Parse AAMVA data
      const parsedData = parse({ text: dataToProcess });
      
      const result: IDScanResult = {
        firstName: parsedData.firstName || parsedData.first_name,
        lastName: parsedData.lastName || parsedData.last_name || parsedData.family_name,
        dateOfBirth: parsedData.dob || parsedData.date_of_birth,
        address: parsedData.address || parsedData.street_address,
        city: parsedData.city,
        state: parsedData.state || parsedData.issuerState,
        zipCode: parsedData.zipCode || parsedData.postal_code || parsedData.zip,
        licenseNumber: parsedData.docId || parsedData.license_number || parsedData.id,
        expirationDate: parsedData.expiration || parsedData.exp_date,
        issuerState: parsedData.issuerState || parsedData.issuer_state
      };

      if (!result.firstName && !result.lastName && !result.licenseNumber) {
        throw new Error('Unable to extract customer information from ID data');
      }

      onScanResult(result);
    } catch (err) {
      console.error('ID parsing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse ID data');
    } finally {
      setIsProcessing(false);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
            Scan Government ID
          </h3>
          <p className="text-xs text-neutral-400">
            Native browser detection + ZXing fallback
          </p>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setIsCameraMode(true);
            if (isCameraActive) stopCamera();
          }}
          className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
            isCameraMode ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
        >
          Camera Scan
        </button>
        <button
          onClick={() => {
            setIsCameraMode(false);
            stopCamera();
          }}
          className={`flex-1 px-3 py-2 rounded text-xs transition-colors ${
            !isCameraMode ? 'bg-blue-600 text-white' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
        >
          Manual Input
        </button>
      </div>

      {isCameraMode ? (
        <div className="space-y-3">
          {/* Video Container */}
          <div className="relative bg-neutral-800 rounded-lg overflow-hidden" style={{ minHeight: '300px' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              style={{ display: isCameraActive ? 'block' : 'none' }}
            />
            
            {!isCameraActive && !isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={startCamera}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Start Camera
                </button>
              </div>
            )}
            
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>{scanStatus}</p>
                </div>
              </div>
            )}
            
            {isCameraActive && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/70 rounded px-3 py-2 text-center">
                  <p className="text-white text-sm font-medium">Status: {scanStatus}</p>
                  <p className="text-neutral-300 text-xs">
                    Position barcode in center of camera view
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          
          {/* Camera Controls */}
          {isCameraActive && (
            <button
              onClick={stopCamera}
              className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
            >
              Stop Camera
            </button>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-2">
            Scanned ID Data
          </label>
          <textarea
            value={scanText}
            onChange={(e) => setScanText(e.target.value)}
            placeholder="Paste or enter the barcode data here..."
            rows={6}
            className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-xs"
        >
          Cancel
        </button>
        
        {!isCameraMode && (
          <button
            onClick={() => handleScan()}
            disabled={isProcessing || !scanText.trim()}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded text-xs"
          >
            {isProcessing ? 'Processing...' : 'Process Data'}
          </button>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        <p className="font-medium mb-1">Detection Methods:</p>
        <p>• Native browser BarcodeDetector (Chrome/Edge)</p>
        <p>• ZXing library fallback (all browsers)</p>
        <p>• Supports PDF417, Code128, QR codes</p>
      </div>
    </div>
  );
}
