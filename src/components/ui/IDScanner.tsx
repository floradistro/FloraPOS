'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

// Try to import BrowserPDF417Reader, fallback if not available
let BrowserPDF417Reader: any;
try {
  BrowserPDF417Reader = require('@zxing/library').BrowserPDF417Reader;
} catch (e) {
  console.warn('BrowserPDF417Reader not available, using MultiFormatReader only');
  BrowserPDF417Reader = null;
}
import { createWorker } from 'tesseract.js';

export interface ScannedIDData {
  firstName: string;
  lastName: string;
  middleName?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  expirationDate?: string;
  sex?: string;
  height?: string;
  weight?: string;
  eyeColor?: string;
  hairColor?: string;
}

interface IDScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDataScanned: (data: ScannedIDData) => void;
  onError: (error: string) => void;
}

// US States mapping for parsing
const US_STATES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

export function IDScanner({ isOpen, onClose, onDataScanned, onError }: IDScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'barcode' | 'photo'>('barcode');
  const [progress, setProgress] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const pdf417Reader = useRef<any>(null);
  const scanInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize barcode readers
  useEffect(() => {
    if (isOpen) {
      codeReader.current = new BrowserMultiFormatReader();
      if (BrowserPDF417Reader) {
        pdf417Reader.current = new BrowserPDF417Reader();
      }
    }
    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
      if (pdf417Reader.current) {
        pdf417Reader.current.reset();
      }
      if (scanInterval.current) {
        clearInterval(scanInterval.current);
      }
    };
  }, [isOpen]);

  // Parse AAMVA-compliant barcode data (PDF417)
  const parseAAMVABarcode = (barcodeText: string): ScannedIDData | null => {
    try {
      setProgress('Parsing driver license data...');
      
      // AAMVA standard format parsing
      const lines = barcodeText.split('\n').filter(line => line.trim());
      const data: Partial<ScannedIDData> = {};
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        // AAMVA Data Element Identifiers
        if (trimmed.startsWith('DAA')) data.firstName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCS')) data.lastName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAD')) data.middleName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAG')) data.address = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAI')) data.city = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAJ')) data.state = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAK')) data.zipCode = trimmed.substring(3).trim();
        if (trimmed.startsWith('DBB')) data.dateOfBirth = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAQ')) data.licenseNumber = trimmed.substring(3).trim();
        if (trimmed.startsWith('DBA')) data.expirationDate = trimmed.substring(3).trim();
        if (trimmed.startsWith('DBC')) data.sex = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAU')) data.height = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAW')) data.weight = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAY')) data.eyeColor = trimmed.substring(3).trim();
        if (trimmed.startsWith('DAZ')) data.hairColor = trimmed.substring(3).trim();
        
        // Alternative formats for different states
        if (trimmed.startsWith('DCT')) data.firstName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCA')) data.lastName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCB')) data.firstName = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCC')) data.lastName = trimmed.substring(3).trim();
        
        // Address parsing variations
        if (trimmed.startsWith('DCG')) data.address = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCH')) data.city = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCI')) data.state = trimmed.substring(3).trim();
        if (trimmed.startsWith('DCJ')) data.zipCode = trimmed.substring(3).trim();
      }
      
      // Validate required fields
      if (!data.firstName || !data.lastName) {
        // Try alternative parsing for non-standard formats
        return parseAlternativeFormat(barcodeText);
      }
      
      // Clean up state codes
      if (data.state && data.state.length === 2) {
        data.state = data.state.toUpperCase();
      }
      
      return data as ScannedIDData;
    } catch (error) {
      console.error('Error parsing AAMVA barcode:', error);
      return null;
    }
  };

  // Parse alternative/legacy formats
  const parseAlternativeFormat = (text: string): ScannedIDData | null => {
    try {
      setProgress('Trying alternative parsing...');
      
      // Split by common delimiters
      const parts = text.split(/[\n\r\|,;]/);
      const data: Partial<ScannedIDData> = {};
      
      // Look for patterns in the text
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        
        // Name patterns (often first few fields)
        if (i === 0 && part.length > 2) data.lastName = part;
        if (i === 1 && part.length > 1) data.firstName = part;
        if (i === 2 && part.length > 0 && part.length < 3) data.middleName = part;
        
        // Date patterns (MMDDYYYY or MM/DD/YYYY)
        if (/^\d{8}$/.test(part) || /^\d{2}\/\d{2}\/\d{4}$/.test(part)) {
          if (!data.dateOfBirth) data.dateOfBirth = part;
          else if (!data.expirationDate) data.expirationDate = part;
        }
        
        // State codes
        if (/^[A-Z]{2}$/.test(part) && US_STATES[part as keyof typeof US_STATES]) {
          data.state = part;
        }
        
        // ZIP codes
        if (/^\d{5}(-\d{4})?$/.test(part)) {
          data.zipCode = part;
        }
        
        // License numbers (alphanumeric, 6-20 chars)
        if (/^[A-Z0-9]{6,20}$/.test(part) && !data.licenseNumber) {
          data.licenseNumber = part;
        }
        
        // Address (longer text fields)
        if (part.length > 10 && /\d/.test(part) && !data.address) {
          data.address = part;
        }
      }
      
      return Object.keys(data).length > 3 ? data as ScannedIDData : null;
    } catch (error) {
      console.error('Error parsing alternative format:', error);
      return null;
    }
  };

  // OCR processing for photo scans
  const processWithOCR = async (imageData: string): Promise<ScannedIDData | null> => {
    try {
      setProgress('Initializing OCR engine...');
      const worker = await createWorker('eng');
      
      setProgress('Processing ID image with OCR...');
      const { data: { text } } = await worker.recognize(imageData);
      
      setProgress('Parsing OCR text...');
      const parsed = parseOCRText(text);
      
      await worker.terminate();
      return parsed;
    } catch (error) {
      console.error('OCR processing error:', error);
      onError('Failed to process ID image with OCR');
      return null;
    }
  };

  // Parse OCR text from driver's license
  const parseOCRText = (text: string): ScannedIDData | null => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const data: Partial<ScannedIDData> = {};
      
      // Common patterns for different states
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const upperLine = line.toUpperCase();
        
        // Name extraction
        if (upperLine.includes('FIRST NAME') || upperLine.includes('GIVEN NAME')) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.match(/^\d/)) data.firstName = nextLine.split(/\s+/)[0];
        }
        
        if (upperLine.includes('LAST NAME') || upperLine.includes('FAMILY NAME') || upperLine.includes('SURNAME')) {
          const nextLine = lines[i + 1];
          if (nextLine && !nextLine.match(/^\d/)) data.lastName = nextLine.split(/\s+/)[0];
        }
        
        // Address extraction
        if (upperLine.includes('ADDRESS') || upperLine.includes('ADDR')) {
          const nextLine = lines[i + 1];
          if (nextLine && /\d/.test(nextLine)) data.address = nextLine;
        }
        
        // City, State, ZIP extraction
        if (/^[A-Z\s]+,\s*[A-Z]{2}\s+\d{5}/.test(line)) {
          const match = line.match(/^([A-Z\s]+),\s*([A-Z]{2})\s+(\d{5})/);
          if (match) {
            data.city = match[1].trim();
            data.state = match[2];
            data.zipCode = match[3];
          }
        }
        
        // Date of birth
        if (upperLine.includes('DOB') || upperLine.includes('DATE OF BIRTH')) {
          const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4}|\d{8})/);
          if (dateMatch) data.dateOfBirth = dateMatch[1];
        }
        
        // License number
        if (upperLine.includes('LIC') || upperLine.includes('LICENSE') || upperLine.includes('ID')) {
          const licMatch = line.match(/([A-Z0-9]{6,20})/);
          if (licMatch) data.licenseNumber = licMatch[1];
        }
        
        // Direct pattern matching for common formats
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(line)) {
          if (!data.dateOfBirth) data.dateOfBirth = line;
          else if (!data.expirationDate) data.expirationDate = line;
        }
        
        // State abbreviation
        if (/^[A-Z]{2}$/.test(line) && US_STATES[line as keyof typeof US_STATES]) {
          data.state = line;
        }
        
        // ZIP code
        if (/^\d{5}(-\d{4})?$/.test(line)) {
          data.zipCode = line;
        }
      }
      
      // Fallback: try to extract name from first few non-numeric lines
      if (!data.firstName || !data.lastName) {
        const nameLines = lines.filter(line => 
          !line.match(/^\d/) && 
          line.length > 2 && 
          line.length < 30 &&
          !line.toUpperCase().includes('LICENSE') &&
          !line.toUpperCase().includes('DRIVER')
        ).slice(0, 3);
        
        if (nameLines.length >= 2) {
          data.lastName = nameLines[0];
          data.firstName = nameLines[1];
        }
      }
      
      return Object.keys(data).length > 3 ? data as ScannedIDData : null;
    } catch (error) {
      console.error('Error parsing OCR text:', error);
      return null;
    }
  };

  // Scan barcode from camera with aggressive processing
  const scanBarcode = useCallback(async () => {
    if (!webcamRef.current || (!codeReader.current && !pdf417Reader.current) || !cameraReady) return;
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      // Increment scan attempts
      setScanAttempts(prev => prev + 1);
      
      // Convert base64 to image element
      const img = new Image();
      img.onload = async () => {
        try {
          // Create multiple canvases for different processing techniques
          const originalCanvas = document.createElement('canvas');
          const originalCtx = originalCanvas.getContext('2d');
          if (!originalCtx) return;
          
          originalCanvas.width = img.width;
          originalCanvas.height = img.height;
          originalCtx.drawImage(img, 0, 0);
          
          // Create processed versions
          const processedImages = await createProcessedImages(img, originalCanvas, originalCtx);
          
          // Try all scanning methods on all processed images
          const scanTasks = [];
          
          for (const { name: imageName, canvas, img: processedImg } of processedImages) {
            // MultiFormat reader attempts
            if (codeReader.current) {
              scanTasks.push(
                tryScanning(`MultiFormat-${imageName}`, () => codeReader.current!.decodeFromImageElement(processedImg))
              );
              // Canvas decoding - use ImageData instead of canvas directly
              const imageData = canvas.getContext('2d')?.getImageData(0, 0, canvas.width, canvas.height);
              if (imageData) {
                scanTasks.push(
                  tryScanning(`MultiFormat-Canvas-${imageName}`, () => codeReader.current!.decodeFromImageElement(processedImg))
                );
              }
            }
            
            // PDF417 reader attempts
            if (pdf417Reader.current) {
              scanTasks.push(
                tryScanning(`PDF417-${imageName}`, () => pdf417Reader.current!.decodeFromImageElement(processedImg))
              );
              // PDF417 Canvas decoding - use image element instead
              scanTasks.push(
                tryScanning(`PDF417-Canvas-${imageName}`, () => pdf417Reader.current!.decodeFromImageElement(processedImg))
              );
            }
          }
          
          // Run all scans in parallel for speed
          const results = await Promise.allSettled(scanTasks);
          
          // Check for successful scans
          for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
              const { method, barcodeText } = result.value;
              console.log(`${method} succeeded! Raw barcode text:`, barcodeText.substring(0, 200));
              
              const parsedData = parseAAMVABarcode(barcodeText);
              if (parsedData) {
                setScanning(false);
                setProgress('ID successfully scanned!');
                onDataScanned(parsedData);
                return;
              }
            }
          }
          
          // No successful scan
          if (debugMode) {
            const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
            console.log(`Tried ${scanTasks.length} scan methods, ${successCount} detected barcodes but none parsed successfully`);
          }
          
        } catch (error) {
          if (debugMode) {
            console.error('Scanning error:', error);
          }
        }
      };
      img.crossOrigin = 'anonymous';
      img.src = imageSrc;
    } catch (error) {
      console.error('Camera capture error:', error);
    }
  }, [cameraReady, onDataScanned, debugMode]);

  // Helper function to try a scanning method
  const tryScanning = async (method: string, scanFn: () => Promise<any>) => {
    try {
      const result = await scanFn();
      if (result) {
        return { method, barcodeText: result.getText() };
      }
    } catch (error) {
      if (debugMode && !(error instanceof NotFoundException)) {
        console.log(`${method} failed:`, error instanceof Error ? error.message : String(error));
      }
    }
    return null;
  };

  // Create multiple processed versions of the image for better detection
  const createProcessedImages = async (originalImg: HTMLImageElement, originalCanvas: HTMLCanvasElement, originalCtx: CanvasRenderingContext2D) => {
    const processedImages = [];
    
    // 1. Original image
    processedImages.push({
      name: 'Original',
      canvas: originalCanvas,
      img: originalImg
    });
    
    // 2. High contrast version
    const contrastCanvas = document.createElement('canvas');
    const contrastCtx = contrastCanvas.getContext('2d');
    if (contrastCtx) {
      contrastCanvas.width = originalCanvas.width;
      contrastCanvas.height = originalCanvas.height;
      contrastCtx.drawImage(originalCanvas, 0, 0);
      
      const imageData = contrastCtx.getImageData(0, 0, contrastCanvas.width, contrastCanvas.height);
      const data = imageData.data;
      
      // Increase contrast dramatically
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 2.5 + 128));     // Red
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 2.5 + 128)); // Green
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 2.5 + 128)); // Blue
      }
      
      contrastCtx.putImageData(imageData, 0, 0);
      
      const contrastImg = new Image();
      contrastImg.src = contrastCanvas.toDataURL();
      
      processedImages.push({
        name: 'HighContrast',
        canvas: contrastCanvas,
        img: contrastImg
      });
    }
    
    // 3. Sharpened version
    const sharpenCanvas = document.createElement('canvas');
    const sharpenCtx = sharpenCanvas.getContext('2d');
    if (sharpenCtx) {
      sharpenCanvas.width = originalCanvas.width;
      sharpenCanvas.height = originalCanvas.height;
      sharpenCtx.drawImage(originalCanvas, 0, 0);
      
      // Apply sharpening filter
      sharpenCtx.filter = 'contrast(150%) brightness(110%) saturate(0%)';
      sharpenCtx.drawImage(originalCanvas, 0, 0);
      
      const sharpenImg = new Image();
      sharpenImg.src = sharpenCanvas.toDataURL();
      
      processedImages.push({
        name: 'Sharpened',
        canvas: sharpenCanvas,
        img: sharpenImg
      });
    }
    
    // 4. Grayscale + High Contrast
    const grayCanvas = document.createElement('canvas');
    const grayCtx = grayCanvas.getContext('2d');
    if (grayCtx) {
      grayCanvas.width = originalCanvas.width;
      grayCanvas.height = originalCanvas.height;
      grayCtx.drawImage(originalCanvas, 0, 0);
      
      const imageData = grayCtx.getImageData(0, 0, grayCanvas.width, grayCanvas.height);
      const data = imageData.data;
      
      // Convert to grayscale and increase contrast
      for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const contrast = Math.min(255, Math.max(0, (gray - 128) * 3 + 128));
        data[i] = contrast;     // Red
        data[i + 1] = contrast; // Green
        data[i + 2] = contrast; // Blue
      }
      
      grayCtx.putImageData(imageData, 0, 0);
      
      const grayImg = new Image();
      grayImg.src = grayCanvas.toDataURL();
      
      processedImages.push({
        name: 'GrayHighContrast',
        canvas: grayCanvas,
        img: grayImg
      });
    }
    
    return processedImages;
  };

  // Enhance image and scan
  const enhanceAndScan = async (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, reader: any) => {
    // Create enhanced version
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Increase contrast and brightness
    for (let i = 0; i < data.length; i += 4) {
      // Increase contrast
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.5 + 128));     // Red
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.5 + 128)); // Green
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.5 + 128)); // Blue
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create a temporary image element from the canvas
    const tempImg = new Image();
    tempImg.src = canvas.toDataURL();
    await new Promise(resolve => tempImg.onload = resolve);
    
    return reader.decodeFromImageElement(tempImg);
  };

  // Scan photo with OCR
  const scanPhoto = useCallback(async () => {
    if (!webcamRef.current || !cameraReady) return;
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      
      setProgress('Capturing ID image...');
      const parsedData = await processWithOCR(imageSrc);
      
      if (parsedData) {
        setScanning(false);
        setProgress('ID successfully processed!');
        onDataScanned(parsedData);
      } else {
        setProgress('Could not read ID. Try better lighting/positioning...');
        setTimeout(() => setProgress(''), 3000);
      }
    } catch (error) {
      console.error('Photo scan error:', error);
      onError('Failed to process ID photo');
    }
  }, [cameraReady, onDataScanned, onError]);

  // Start scanning
  const startScanning = () => {
    setScanning(true);
    setProgress('Scanning for barcode...');
    setScanAttempts(0);
    
    if (scanMode === 'barcode') {
      // Very aggressive scanning - every 200ms
      scanInterval.current = setInterval(scanBarcode, 200);
      // Immediate first scan
      scanBarcode();
    } else {
      // Single photo capture with OCR
      setTimeout(scanPhoto, 1000);
    }
  };

  // Stop scanning
  const stopScanning = () => {
    setScanning(false);
    setProgress('');
    if (scanInterval.current) {
      clearInterval(scanInterval.current);
      scanInterval.current = null;
    }
  };

  // Handle close
  const handleClose = () => {
    stopScanning();
    setCameraReady(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-neutral-800 border border-white/[0.08] rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              Scan Driver's License
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              Supports all 50 US states • Position ID in camera view
            </p>
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

        {/* Scan Mode Selection */}
        <div className="px-6 py-4 border-b border-neutral-700">
          <div className="flex gap-4 mb-3">
            <button
              onClick={() => {
                setScanMode('barcode');
                stopScanning();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scanMode === 'barcode'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Barcode Scan (Recommended)
            </button>
            <button
              onClick={() => {
                setScanMode('photo');
                stopScanning();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                scanMode === 'photo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
              }`}
            >
              Photo OCR
            </button>
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                debugMode
                  ? 'bg-orange-600 text-white'
                  : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
              }`}
              title="Toggle debug mode"
            >
              Debug
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-neutral-500">
              {scanMode === 'barcode' 
                ? 'Scans the PDF417 barcode on the back of most driver\'s licenses'
                : 'Uses OCR to read text from the front of the license'
              }
            </p>
            {scanMode === 'barcode' && (
              <p className="text-xs text-yellow-400">
                💡 Tip: Position the barcode (rectangular pattern) clearly in the center of the camera view
              </p>
            )}
            {debugMode && (
              <div className="space-y-1">
                <p className="text-xs text-orange-400">
                  🔧 Debug mode enabled - check console for detailed scan logs
                </p>
                <button
                  onClick={() => {
                    // Test with sample AAMVA data
                    const testBarcode = `@\n\nANSI 636014040002DL00410288ZA03290015DLDAQD12345678\nDCSSMITH\nDDEN\nDACJOHN\nDDFN\nDADMICHAEL\nDDGN\nDCAD\nDCBNONE\nDCDPH\nDBD09152019\nDBB01151990\nDBA01152025\nDBC1\nDAU600\nDAYBRO\nDAG123 MAIN STREET\nDAIANYTOWN\nDAJCA\nDAK90210  \nDCFNONE\nDCGUSA\nDCK12345678901234567\nDDAM\nDDB09152019\nDDC09152019\nDDD1`;
                    const parsedData = parseAAMVABarcode(testBarcode);
                    if (parsedData) {
                      onDataScanned(parsedData);
                    } else {
                      console.log('Test barcode parsing failed');
                    }
                  }}
                  className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                >
                  Test Parser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Camera View */}
        <div className="p-6">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              screenshotQuality={1.0}
              videoConstraints={{
                width: { ideal: 1920, min: 1280 },
                height: { ideal: 1080, min: 720 },
                facingMode: 'environment',
                frameRate: { ideal: 30, min: 15 }
              }}
              className="w-full h-full object-cover"
              onUserMedia={() => {
                setCameraReady(true);
                setProgress('Camera ready. Position barcode in view and start scanning.');
              }}
              onUserMediaError={(error) => {
                console.error('Camera error:', error);
                onError('Failed to access camera. Please check permissions.');
              }}
            />
            
            {/* Scanning overlay with animated scanner line */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Animated scanning line */}
                <div className="absolute inset-4 border-2 border-blue-500/50 rounded-lg overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-pulse"></div>
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-400/80 animate-bounce" style={{
                    animation: 'scanning 2s linear infinite'
                  }}></div>
                </div>
                
                {/* Status indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-white text-sm font-medium">
                      Scanning... (Attempt {scanAttempts})
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <style jsx>{`
              @keyframes scanning {
                0% { top: 0; }
                50% { top: calc(100% - 2px); }
                100% { top: 0; }
              }
            `}</style>
            
            {/* Guide overlay */}
            {!scanning && cameraReady && (
              <div className="absolute inset-4 border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center">
                <div className="text-center text-white/80">
                  {scanMode === 'barcode' ? (
                    <>
                      <div className="w-16 h-10 mx-auto mb-2 border-2 border-white/60 rounded flex items-center justify-center">
                        <div className="w-12 h-6 bg-white/20 rounded-sm flex flex-col justify-between p-1">
                          <div className="h-0.5 bg-white/60 rounded"></div>
                          <div className="h-0.5 bg-white/60 rounded"></div>
                          <div className="h-0.5 bg-white/60 rounded"></div>
                          <div className="h-0.5 bg-white/60 rounded"></div>
                        </div>
                      </div>
                      <p className="text-sm font-medium">Position PDF417 Barcode</p>
                      <p className="text-xs text-white/60 mt-1">
                        Look for rectangular barcode on back of license
                      </p>
                    </>
                  ) : (
                    <>
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm">Position entire license clearly in view</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="mt-4 p-3 bg-blue-600/10 border border-blue-600/20 rounded-lg">
              <p className="text-blue-400 text-sm">{progress}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={scanning ? stopScanning : startScanning}
              disabled={!cameraReady}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                scanning
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {scanning ? 'Stop Scanning' : `Start ${scanMode === 'barcode' ? 'Barcode' : 'Photo'} Scan`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
