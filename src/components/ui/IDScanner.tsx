'use client';

import React, { useState, useRef, useEffect } from 'react';
import { parse } from '@digitalbazaar/aamva-parse';
import { BrowserMultiFormatReader, BrowserPDF417Reader } from '@zxing/library';

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

export function IDScanner({ onScanResult, onCancel, isScanning = false }: IDScannerProps) {
  const [scanText, setScanText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraMode, setIsCameraMode] = useState(true);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const pdf417Reader = useRef<BrowserPDF417Reader | null>(null);
  const scanningInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera scanner optimized for government IDs
  const initializeCamera = async () => {
    if (!videoRef.current || codeReader.current) return;
    
    try {
      setIsProcessing(true);
      setError(null);
      
      console.log('🆔 Starting government ID scanner...');
      
      // Initialize both readers for maximum compatibility
      codeReader.current = new BrowserMultiFormatReader();
      pdf417Reader.current = new BrowserPDF417Reader();
      
      // Get available cameras and prefer back camera
      const videoInputDevices = await codeReader.current.getVideoInputDevices();
      console.log('📷 Available cameras:', videoInputDevices.length);
      
      let selectedDeviceId = videoInputDevices[0]?.deviceId;
      
      // Look for back/rear camera
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      if (backCamera) {
        selectedDeviceId = backCamera.deviceId;
        console.log('📱 Using back camera:', backCamera.label);
      }
      
      // Start video stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: { ideal: 'environment' }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Start continuous scanning for government ID barcodes
      startContinuousScanning();
      
      setIsCameraActive(true);
      setIsProcessing(false);
      setCameraPermission('granted');
      
      console.log('🎯 Government ID scanner ready!');
      
    } catch (err) {
      console.error('💥 ID scanner failed:', err);
      
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setCameraPermission('denied');
        setError('Camera access denied. Please enable camera permissions for ID scanning.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError(`ID scanner initialization failed: ${error.message}`);
      }
      
      setIsProcessing(false);
      setIsCameraActive(false);
      cleanup();
    }
  };

  // Continuous scanning for government ID barcodes
  const startContinuousScanning = () => {
    if (!videoRef.current || !codeReader.current || !pdf417Reader.current) return;
    
    const scanFrame = async () => {
      if (!videoRef.current || !isCameraActive) return;
      
      try {
        // Try PDF417 first (most common on driver's licenses)
        try {
          const result = await pdf417Reader.current!.decodeFromVideoElement(videoRef.current);
          if (result && result.text) {
            console.log('🎯 PDF417 barcode detected:', result.text);
            handleBarcodeDetected(result.text);
            return;
          }
        } catch (pdf417Error) {
          // PDF417 failed, try multi-format reader
        }
        
        // Try multi-format reader for other barcode types
        try {
          // Create a canvas to capture the current video frame
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context && videoRef.current) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0);
            
            const result = await codeReader.current!.decodeFromCanvas(canvas);
            if (result && result.text) {
              console.log('🎯 Barcode detected:', result.text, 'Format:', result.format);
              handleBarcodeDetected(result.text);
              return;
            }
          }
        } catch (multiError) {
          // No barcode found, continue scanning
        }
        
      } catch (error) {
        // Scanning error, continue
      }
    };
    
    // Scan every 500ms for better performance
    scanningInterval.current = setInterval(scanFrame, 500);
  };
  
  // Handle detected barcode
  const handleBarcodeDetected = (barcodeText: string) => {
    console.log('🆔 Government ID barcode detected:', barcodeText);
    stopCamera();
    setScanText(barcodeText);
    setTimeout(() => handleScan(barcodeText), 100);
  };
  
  // Cleanup function
  const cleanup = () => {
    if (scanningInterval.current) {
      clearInterval(scanningInterval.current);
      scanningInterval.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.warn('Error resetting code reader:', e);
      }
      codeReader.current = null;
    }
    
    pdf417Reader.current = null;
  };

  // Stop camera scanner
  const stopCamera = async () => {
    console.log('⏹️ Stopping ID scanner...');
    cleanup();
    setIsCameraActive(false);
    setIsProcessing(false);
    console.log('✅ ID scanner stopped');
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const handleScan = async (barcodeData?: string) => {
    const dataToProcess = barcodeData || scanText.trim();
    
    if (!dataToProcess) {
      setError('Please scan a barcode or paste the scanned ID data');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Parse the AAMVA data
      const parsedData = parse({ text: dataToProcess });
      
      // Map AAMVA fields to our customer data structure
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

      // Validate that we got at least some essential data
      if (!result.firstName && !result.lastName && !result.licenseNumber) {
        throw new Error('Unable to extract customer information from ID data');
      }

      onScanResult(result);
    } catch (err) {
      console.error('ID scanning error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse ID data. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Allow the paste to happen naturally, then process
    setTimeout(() => {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && pastedText.length > 50) {
        // Automatically attempt to scan if substantial data is pasted
        handleScan();
      }
    }, 100);
  };

  return (
    <div className="space-y-4">
      <style jsx>{`
        .id-scanner-video {
          width: 100%;
          height: 264px;
          object-fit: cover;
          border-radius: 8px;
          background: #1f2937;
        }
      `}</style>
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
            Optimized for driver's licenses and state IDs
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
          className={`flex-1 px-3 py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 ${
            isCameraMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
          style={{ fontFamily: 'Tiempos, serif' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Camera Scan
        </button>
        <button
          onClick={() => {
            setIsCameraMode(false);
            stopCamera();
          }}
          className={`flex-1 px-3 py-2 rounded text-xs transition-colors flex items-center justify-center gap-2 ${
            !isCameraMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
          }`}
          style={{ fontFamily: 'Tiempos, serif' }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Manual Input
        </button>
      </div>

      <div className="space-y-3">
        {isCameraMode ? (
          <>
            {/* Camera Scanner */}
            <div className="space-y-3">
              <div className="relative">
                <div
                  ref={scannerRef}
                  className="w-full h-64 bg-neutral-800 rounded-lg overflow-hidden relative"
                >
                  {/* Video element for government ID scanning */}
                  <video
                    ref={videoRef}
                    className="id-scanner-video"
                    style={{ 
                      display: isCameraActive ? 'block' : 'none'
                    }}
                    playsInline
                    muted
                  />
                  
                  {!isCameraActive && !isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-neutral-400 text-sm" style={{ fontFamily: 'Tiempos, serif' }}>
                          Click "Start Camera" to scan government ID
                        </p>
                        <p className="text-neutral-500 text-xs mt-2" style={{ fontFamily: 'Tiempos, serif' }}>
                          Supports PDF417, Code 128, and all ID formats
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {isProcessing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50 z-10">
                      <div className="text-center">
                        <svg className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-neutral-300 text-sm">Initializing government ID scanner...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Scanning instructions overlay */}
                {isCameraActive && (
                  <div className="absolute bottom-2 left-2 right-2 pointer-events-none">
                    <div className="bg-black/70 rounded px-3 py-2 text-center">
                      <p className="text-white text-xs font-medium">
                        🆔 Position state ID or driver's license barcode in view
                      </p>
                      <p className="text-neutral-300 text-xs mt-1">
                        Advanced scanner detects PDF417 and all government ID formats
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Camera Controls */}
              <div className="flex gap-2">
                {!isCameraActive ? (
                  <>
                    <button
                      onClick={initializeCamera}
                      disabled={isProcessing}
                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-neutral-600 text-white rounded text-xs transition-colors flex items-center justify-center gap-2"
                      style={{ fontFamily: 'Tiempos, serif' }}
                    >
                      {isProcessing ? (
                        <>
                          <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Initializing...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Start Camera
                        </>
                      )}
                    </button>
                    
                    {/* Retry button if there was an error */}
                    {error && !isProcessing && (
                      <button
                        onClick={() => {
                          setError(null);
                          setCameraPermission('prompt');
                          initializeCamera();
                        }}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors flex items-center justify-center gap-1"
                        style={{ fontFamily: 'Tiempos, serif' }}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Retry
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Tiempos, serif' }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9l6 6m0-6l-6 6" />
                    </svg>
                    Stop Camera
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Manual Input */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2" style={{ fontFamily: 'Tiempos, serif' }}>
                Scanned ID Data
              </label>
              <textarea
                ref={textareaRef}
                value={scanText}
                onChange={(e) => setScanText(e.target.value)}
                onPaste={handlePaste}
                placeholder="Paste the scanned driver's license data here..."
                rows={6}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded text-white placeholder-neutral-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono"
                style={{ fontSize: '11px', lineHeight: '1.3' }}
              />
            </div>
          </>
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
            disabled={isProcessing}
            className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded text-xs transition-colors disabled:opacity-50"
            style={{ fontFamily: 'Tiempos, serif' }}
          >
            Cancel
          </button>
          
          {/* Only show manual scan button in manual mode */}
          {!isCameraMode && (
            <button
              onClick={() => handleScan()}
              disabled={isProcessing || !scanText.trim()}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded text-xs transition-colors flex items-center justify-center gap-2"
              style={{ fontFamily: 'Tiempos, serif' }}
            >
              {isProcessing ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Process Data
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-xs text-neutral-500 space-y-1">
          {isCameraMode ? (
            <>
              <p>• Professional government ID scanner with PDF417 support</p>
              <p>• Optimized for state driver's licenses and ID cards</p>
              <p>• Supports all standard government barcode formats</p>
              <p>• Automatically extracts and processes customer data</p>
              {cameraPermission === 'denied' && (
                <p className="text-red-400">• Camera access denied - please enable camera permissions</p>
              )}
            </>
          ) : (
            <>
              <p>• Use your ID scanner to scan a driver's license</p>
              <p>• Paste the resulting data in the text area above</p>
              <p>• Customer information will be automatically extracted</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
