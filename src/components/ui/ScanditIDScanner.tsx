'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

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

interface ScanditIDScannerProps {
  onScanResult: (result: IDScanResult) => void;
  onCancel: () => void;
  isScanning?: boolean;
}

export function ScanditIDScanner({ onScanResult, onCancel }: ScanditIDScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<string>('Initializing...');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const viewRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const viewRefSDK = useRef<any>(null);
  const idCaptureRef = useRef<any>(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize Scandit SDK
  const initializeScandit = async () => {
    if (!isClient) return;
    
    try {
      setIsProcessing(true);
      setScanStatus('Loading Scandit SDK...');
      setError(null);
      console.log('🔍 Starting Scandit initialization...');

      // Dynamic import of Scandit modules (client-side only)
      console.log('📦 Loading Scandit modules...');
      const [SDCCore, SDCId] = await Promise.all([
        import('@scandit/web-datacapture-core'),
        import('@scandit/web-datacapture-id')
      ]);
      console.log('✅ Scandit modules loaded successfully');

      setScanStatus('Configuring Scandit SDK...');
      console.log('⚙️ Configuring Scandit SDK...');

      // Configure Scandit with license key and library location
      console.log('🔑 License key:', process.env.NEXT_PUBLIC_SCANDIT_LICENSE_KEY ? 'Present' : 'Missing');
      console.log('📍 Library location:', new URL('/scandit/', window.location.origin).href);
      
      await SDCCore.configure({
        licenseKey: process.env.NEXT_PUBLIC_SCANDIT_LICENSE_KEY || 'AgeGYiLhBGJdQp37D/G+XhtFawpGLLav3AK8r0IwAoMMApXCsk1i2Qx+rWZuQay0bngpEUlHu/iGVrLnuAlDUgwF/1vAeDqQcl700cwV/q+LOctTCCV41gMXguzHSYWCtgFkm/QBeLVvWMZhEWF22YRlVGCDadZjlEBbyPRS5usfZ6nhmX/EACpsY13aSkKgA2GRdvURjOTmctxY3nnHdHZT52XMUY+omUgACTZsdJuAVpqwnhdn7flykzW8cwewp1G1mQZpLosyeSmD/mhZrcpShQeieYoqbEQWIklHV90Nei7i53yeMKZv3fL+TRFJwlPjeCxX6iT6btwp7mlxFOB/IWs8fC1lBm6WGKZ9zbAiXKHXyTDizt5b1bSeYkSyIRRik09VrJ+7YxLpRC03JL9ktcmkQWhbvF4lZFk9YUJsdVihSWP+SeUWPppgXilpu1zUrwBXnMP3EmLsPgPzoTgO1i9TeN4v+lkXLqhoKZlxEvZUNBkjflx09uRzYJF3WEMrhOp0RxKtbsvMIQnclmBCKtQS3PWrd4TzL/oAQ0L0jFGSg4dVVCXQD9lJT/3qurovGYztTyJLCdfLNdN59VjuT4GNSd09HaRJqcLKyvqWLO2JJE7ct+ThEEoZ6joCLlnQYfdsk3exfrUCntGJQbg+GSVJKeX0Q3ChUFVRpDCj5vBhMqlg8tuHl5tG2puxYoZl5gdV4M8CUTL/xdW5yq477rdlORCKs4atbIRut+KXnUymRJkGfWRsbv007NVRaBjIHc/MOPxmyVjodpKKGxh4dSlquVcvSHVAHTOfkwO4lFuJE6sFYiFaVNHlncWb84SQcFAYpPZSkS7ccYM/L7HqyiFp47W6LQ78gnbmtZ925X29Zncp/WuXPsBR+J2MVRGOb964LdDHCxkuzgg1DS5g9Jg9YFq6sk+A1gc0hUxl3mGp6aJ3Pz4bDv372528FCJzTdIEWHSagtusHfEGi3RgiXQAOGGvSGqyr63OEcG6zUdloljBZ8jnJIsVvwTnu8finGuOEc9okPwIaUz5nKepYw0sbnT/8OJ4boS8YFqMfH47lnJ4MLXiJ8uUS1ITfJwWYAOnP7jzpTq/qvVaqQ5l5I5Y0owY41nvrN7xuNpQj+JtSaR8Rxdvy7WncBjGMKI9zUEfZr4y27MfEz39bYCI8WBJP0pnEHvLnlNpX1aoljS8GY/7C9ic+vi7AZHYwrI=',
        libraryLocation: new URL('/scandit/', window.location.origin).href,
        moduleLoaders: [SDCId.idCaptureLoader()]
      });
      console.log('✅ Scandit SDK configured successfully');

      // Create data capture context
      console.log('🏗️ Creating data capture context...');
      const context = await SDCCore.DataCaptureContext.create();
      contextRef.current = context;
      console.log('✅ Data capture context created');

      // Create camera and use it on the context
      console.log('📹 Setting up camera...');
      const camera = SDCCore.Camera.default;
      if (!camera) {
        throw new Error('Default camera not available');
      }
      
      console.log('🔗 Setting frame source...');
      await context.setFrameSource(camera);
      cameraRef.current = camera;
      console.log('✅ Camera set as frame source');

      // Create ID capture settings
      console.log('⚙️ Creating ID capture settings...');
      const settings = new SDCId.IdCaptureSettings();
      
      // Set up accepted documents - US driver's licenses and ID cards
      settings.acceptedDocuments = [
        new SDCId.DriverLicense(SDCId.Region.Us),
        new SDCId.IdCard(SDCId.Region.Us),
        new SDCId.DriverLicense(SDCId.Region.Any),
        new SDCId.IdCard(SDCId.Region.Any)
      ];
      
      // Use SingleSideScanner with all capabilities enabled
      settings.scannerType = new SDCId.SingleSideScanner(
        true,  // barcode
        true,  // machineReadableZone
        true   // visualInspectionZone
      );
      
      console.log('✅ ID capture settings configured');

      // Create ID capture mode
      console.log('🔧 Creating ID capture mode...');
      const idCapture = await SDCId.IdCapture.forContext(context, settings);
      idCaptureRef.current = idCapture;
      console.log('✅ ID capture mode created');

      // Add listener for ID capture results
      console.log('📱 Adding ID capture listener...');
      const listener = {
        didCaptureId: async (capturedId: any) => {
          console.log('🎉 didCaptureId callback triggered!');
          console.log('📄 Captured ID object:', capturedId);
          await handleIdCaptured(capturedId);
        },
        didFailWithError: (idCapture: any, error: any) => {
          console.error('❌ didFailWithError callback triggered:', error);
          setError(`ID capture failed: ${error.message}`);
        },
        didRejectId: (capturedId: any, reason: any) => {
          console.log('🚫 didRejectId callback triggered:', reason);
          console.log('📄 Rejected ID:', capturedId);
          setError(`ID rejected: ${reason}`);
        },
        didLocalizeId: (localization: any) => {
          console.log('📍 didLocalizeId callback triggered (ID detected but not captured yet):', localization);
          setScanStatus('ID detected, processing...');
        }
      };
      
      console.log('🔗 Registering listener:', listener);
      idCapture.addListener(listener);
      console.log('✅ ID capture listener added successfully');

      // Create the data capture view
      if (viewRef.current) {
        console.log('📺 Creating data capture view...');
        const view = await SDCCore.DataCaptureView.forContext(context);
        console.log('✅ Data capture view created');
        
        console.log('🔗 Connecting view to DOM element...');
        view.connectToElement(viewRef.current);
        console.log('✅ View connected to DOM element');
        
        console.log('🎨 Creating ID capture overlay...');
        const overlay = await SDCId.IdCaptureOverlay.withIdCapture(idCapture);
        console.log('✅ ID capture overlay created');
        
        console.log('📎 Adding overlay to view...');
        await view.addOverlay(overlay);
        console.log('✅ ID capture overlay added to view');
        
        viewRefSDK.current = view;
      }

      setIsInitialized(true);
      setScanStatus('Ready to scan ID');
      
      // Enable ID capture mode
      console.log('🔄 Enabling ID capture mode...');
      await idCapture.setEnabled(true);
      console.log('✅ ID capture mode enabled');
      
      // Start camera
      console.log('📹 Starting camera...');
      await camera.switchToDesiredState(SDCCore.FrameSourceState.On);
      console.log('✅ Camera started');
      setScanStatus('Scanning for ID...');
      
      // Debug: Check if everything is working
      console.log('🔍 Final setup check:');
      console.log('- Context:', context);
      console.log('- Camera state:', camera);
      console.log('- ID capture enabled:', await idCapture.isEnabled());
      console.log('- View connected:', !!viewRefSDK.current);
      
    } catch (err) {
      console.error('Scandit initialization error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(`Failed to initialize scanner: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setScanStatus('Initialization failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle captured ID
  const handleIdCaptured = async (capturedId: any) => {
    console.log('🎯 ID captured - raw data:', capturedId);
    console.log('🔍 Available properties:', Object.keys(capturedId));
    
    try {
      // Stop scanning
      if (cameraRef.current) {
        try {
          const SDCCore = await import('@scandit/web-datacapture-core');
          await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off);
        } catch (err) {
          console.error('Failed to stop camera:', err);
        }
      }
      
      setScanStatus('Processing ID data...');
      
      // Extract data from captured ID using new SDK 7.6 structure
      const result: IDScanResult = {};
      
      console.log('📋 Extracting data from CapturedId...');
      console.log('- firstName:', capturedId.firstName);
      console.log('- lastName:', capturedId.lastName);
      console.log('- documentNumber:', capturedId.documentNumber);
      console.log('- dateOfBirth:', capturedId.dateOfBirth);
      console.log('- dateOfExpiry:', capturedId.dateOfExpiry);
      console.log('- address:', capturedId.address);
      console.log('- issuingCountry:', capturedId.issuingCountry);
      
      // Direct properties from CapturedId (SDK 7.6 structure)
      result.firstName = capturedId.firstName || undefined;
      result.lastName = capturedId.lastName || undefined;
      result.licenseNumber = capturedId.documentNumber || undefined;
      
      // Handle DateResult objects
      if (capturedId.dateOfBirth && capturedId.dateOfBirth.day && capturedId.dateOfBirth.month && capturedId.dateOfBirth.year) {
        const dob = capturedId.dateOfBirth;
        result.dateOfBirth = `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`;
      }
      
      if (capturedId.dateOfExpiry && capturedId.dateOfExpiry.day && capturedId.dateOfExpiry.month && capturedId.dateOfExpiry.year) {
        const exp = capturedId.dateOfExpiry;
        result.expirationDate = `${exp.year}-${String(exp.month).padStart(2, '0')}-${String(exp.day).padStart(2, '0')}`;
      }
      
      // Address (might be a single string in new API)
      result.address = capturedId.address || undefined;
      
      // Issuing state/country
      result.issuerState = capturedId.issuingCountry || undefined;
      
      // Try to extract more detailed info from barcode result if available
      if (capturedId.barcode) {
        console.log('📊 Barcode result available:', capturedId.barcode);
        const barcode = capturedId.barcode;
        
        // Override with barcode data if available
        result.firstName = result.firstName || barcode.firstName || undefined;
        result.lastName = result.lastName || barcode.lastName || undefined;
        result.licenseNumber = result.licenseNumber || barcode.documentNumber || undefined;
        
        // Try to get more address details from barcode
        if (barcode.address) {
          result.address = result.address || barcode.address || undefined;
        }
        if (barcode.city) {
          result.city = barcode.city || undefined;
        }
        if (barcode.state) {
          result.state = barcode.state || undefined;
        }
        if (barcode.postalCode) {
          result.zipCode = barcode.postalCode || undefined;
        }
      }
      
      // Try VIZ result for additional data
      if (capturedId.vizResult) {
        console.log('👁️ VIZ result available:', capturedId.vizResult);
        const viz = capturedId.vizResult;
        
        result.firstName = result.firstName || viz.firstName || undefined;
        result.lastName = result.lastName || viz.lastName || undefined;
        result.licenseNumber = result.licenseNumber || viz.documentNumber || undefined;
      }
      
      console.log('✅ Extracted result:', result);
      
      // Validate we got essential information
      if (!result.firstName && !result.lastName && !result.licenseNumber) {
        console.error('❌ Validation failed - missing essential data');
        throw new Error('Unable to extract essential information from ID. Please ensure the ID is clearly visible and try again.');
      }
      
      console.log('🎉 ID processing successful!');
      setScanStatus('ID processed successfully!');
      onScanResult(result);
      
    } catch (err) {
      console.error('❌ ID processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process ID data');
      setScanStatus('Processing failed');
    }
  };

  // Start scanning
  const startScanning = async () => {
    console.log('🚀 Start scanning called');
    
    if (!isInitialized) {
      console.log('⚠️ Not initialized, initializing Scandit...');
      await initializeScandit();
      return;
    }
    
    try {
      console.log('🔄 Enabling ID capture...');
      if (idCaptureRef.current) {
        await idCaptureRef.current.setEnabled(true);
        console.log('✅ ID capture enabled');
      }
      
      if (cameraRef.current) {
        console.log('📹 Starting camera...');
        const SDCCore = await import('@scandit/web-datacapture-core');
        await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.On);
        console.log('✅ Camera started');
        setScanStatus('Scanning for ID...');
      }
    } catch (err) {
      console.error('❌ Failed to start scanning:', err);
      setError('Failed to start camera');
    }
  };

  // Stop scanning
  const stopScanning = async () => {
    console.log('🛑 Stop scanning called');
    
    try {
      console.log('🔄 Disabling ID capture...');
      if (idCaptureRef.current) {
        await idCaptureRef.current.setEnabled(false);
        console.log('✅ ID capture disabled');
      }
      
      if (cameraRef.current) {
        console.log('📹 Stopping camera...');
        const SDCCore = await import('@scandit/web-datacapture-core');
        await cameraRef.current.switchToDesiredState(SDCCore.FrameSourceState.Off);
        console.log('✅ Camera stopped');
      }
      setScanStatus('Scanning stopped');
    } catch (err) {
      console.error('❌ Failed to stop scanning:', err);
    }
  };

  // Client-side detection
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize when client-side is ready
  useEffect(() => {
    if (isClient) {
      initializeScandit();
    }
    
    return () => {
      if (contextRef.current) {
        contextRef.current.dispose();
      }
    };
  }, [isClient]);

  // Show loading state during SSR
  if (!isClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
          </div>
          <div>
            <h3 className="font-medium text-white" style={{ fontFamily: 'Tiempos, serif' }}>
              Loading Scanner...
            </h3>
            <p className="text-xs text-neutral-400">
              Initializing Scandit SDK
            </p>
          </div>
        </div>
        <div className="relative bg-neutral-800 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>Loading scanner...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            Powered by Scandit SDK
          </p>
        </div>
      </div>

      {/* Scanner View */}
      <div className="relative bg-neutral-800 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
        <div
          ref={viewRef}
          className="w-full h-full min-h-[400px]"
          style={{ position: 'relative' }}
        />
        
        {/* Status Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-black/70 rounded px-3 py-2 text-center">
            <p className="text-white text-sm font-medium">Status: {scanStatus}</p>
            <p className="text-neutral-300 text-xs">
              Position ID within the scanning area
            </p>
          </div>
        </div>
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p>{scanStatus}</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            stopScanning();
            onCancel();
          }}
          className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 rounded text-xs"
        >
          Cancel
        </button>
        
        {isInitialized && (
          <>
            <button
              onClick={startScanning}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
            >
              Start Scanning
            </button>
            <button
              onClick={stopScanning}
              className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
            >
              Stop Scanning
            </button>
          </>
        )}
      </div>

      <div className="text-xs text-neutral-500">
        <p className="font-medium mb-1">Scandit ID Capture Features:</p>
        <p>• High-accuracy ID document scanning</p>
        <p>• Support for driver's licenses and ID cards</p>
        <p>• VIZ and barcode data extraction</p>
        <p>• Real-time document detection</p>
      </div>
    </div>
  );
}
