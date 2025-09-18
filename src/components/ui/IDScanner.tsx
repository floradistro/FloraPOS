'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrowserPDF417Reader } from '@zxing/browser';
import { parseIDBarcode, ParsedIDData, validateParsedData } from '../../utils/idParser';

interface IDScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataScanned: (data: ParsedIDData) => void;
  onError?: (error: string) => void;
}

export function IDScanner({ isOpen, onClose, onDataScanned, onError }: IDScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<BrowserPDF417Reader | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize scanner
  useEffect(() => {
    if (isOpen && !scannerRef.current) {
      scannerRef.current = new BrowserPDF417Reader();
    }
  }, [isOpen]);

  // Start camera when opened
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(true);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
        
        // Start scanning when video is ready
        videoRef.current.onloadedmetadata = () => {
          startScanning();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setHasPermission(false);
      setError('Camera access denied. Please allow camera access to scan ID.');
      setIsScanning(false);
      onError?.('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const startScanning = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !scannerRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    const scan = async () => {
      if (!video || !canvas || !ctx || !scannerRef.current) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Try to decode barcode from canvas
        const result = await scannerRef.current.decodeFromCanvas(canvas);
        
        if (result) {
          const barcodeText = result.getText();
          console.log('Raw barcode data:', barcodeText);
          
          // Parse the ID data
          const parsedData = parseIDBarcode(barcodeText);
          
          if (parsedData && validateParsedData(parsedData)) {
            console.log('Parsed ID data:', parsedData);
            setIsScanning(false);
            onDataScanned(parsedData);
            onClose();
            return; // Stop scanning on success
          } else {
            console.warn('Could not parse valid ID data from barcode');
          }
        }
      } catch (err) {
        // Continue scanning - most frames won't have valid barcodes
      }

      // Continue scanning
      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(scan);
      }
    };

    // Start the scanning loop
    animationFrameRef.current = requestAnimationFrame(scan);
  }, [isScanning, onDataScanned, onClose]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100000]">
      <div className="bg-neutral-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white">Scan State ID</h2>
            <p className="text-sm text-neutral-400 mt-1">Position the ID barcode in the camera view</p>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-300 transition-colors p-2 hover:bg-neutral-700 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scanner Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {hasPermission === null && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-neutral-300">Requesting camera access...</p>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-neutral-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-neutral-300 mb-4">Camera access is required to scan ID barcodes</p>
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Allow Camera Access
              </button>
            </div>
          )}

          {hasPermission && (
            <div className="relative">
              {/* Video Feed */}
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg"
                autoPlay
                playsInline
                muted
              />
              
              {/* Hidden canvas for processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Scanning Frame */}
                <div className="absolute inset-4 border-2 border-blue-500 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg"></div>
                </div>

                {/* Instructions */}
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                    <p className="text-white text-sm">
                      {isScanning ? 'Scanning for ID barcode...' : 'Position ID barcode in frame'}
                    </p>
                  </div>
                </div>

                {/* Scanning Animation */}
                {isScanning && (
                  <div className="absolute inset-4 pointer-events-none">
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-4 text-sm text-neutral-400">
            <p className="mb-2"><strong className="text-neutral-300">Instructions:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Hold the ID steady with the barcode facing the camera</li>
              <li>• Ensure good lighting on the barcode</li>
              <li>• The barcode is usually on the back of the ID</li>
              <li>• Keep the camera steady until scanning completes</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-700 flex justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 border border-neutral-600 text-neutral-300 hover:text-white rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
