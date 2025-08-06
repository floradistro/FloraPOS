'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat } from '@zxing/library'

interface IDScannerData {
  firstName?: string
  lastName?: string
  middleName?: string
  fullName?: string
  dateOfBirth?: string
  address?: string
  streetAddress?: string
  streetAddress2?: string
  city?: string
  state?: string
  zipCode?: string
  licenseNumber?: string
  expirationDate?: string
  issueDate?: string
  gender?: string
  customerIdNumber?: string
  ncSpecificField?: string
  isValid: boolean
  errors?: string[]
}

interface IDScannerProps {
  isOpen: boolean
  onClose: () => void
  onScanComplete: (data: IDScannerData) => void
}

export function IDScanner({ isOpen, onClose, onScanComplete }: IDScannerProps) {
  if (!isOpen) return null
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualData, setManualData] = useState('')
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    // Initialize with all formats (ZXing will automatically detect the best one)
    codeReader.current = new BrowserMultiFormatReader()
    startScanning()

    return () => {
      stopScanning()
    }
  }, [])

  const startScanning = async () => {
    try {
      setIsScanning(true)
      setError(null)

      if (!codeReader.current || !videoRef.current) return

      // Request camera permissions explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera access granted, starting scanner...')

      // Start scanning with better error handling
      await codeReader.current.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
        if (result) {
          const scannedData = result.getText()
          console.log('Raw scanned data:', scannedData)
          console.log('Barcode format:', result.getBarcodeFormat())
          
          // Parse driver license data
          const parsedData = parseDriverLicenseData(scannedData)
          console.log('Parsed data:', parsedData)
          
          if (parsedData && Object.keys(parsedData).length > 0) {
            onScanComplete({ ...parsedData, isValid: parsedData.isValid ?? true } as IDScannerData)
            stopScanning()
          } else {
            console.log('No valid license data found, continuing scan...')
          }
        }
        
        if (error && !(error instanceof NotFoundException)) {
          console.error('Scanning error:', error)
        }
      })
    } catch (err) {
      console.error('Failed to start camera:', err)
      setError('Failed to access camera. Please allow camera permissions and try again.')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
    }
    setIsScanning(false)
  }

  const parseDriverLicenseData = (data: string) => {
    console.log('Parsing license data:', data)
    
    // Handle different data formats
    let lines: string[] = []
    
    // Split by different possible delimiters
    if (data.includes('\n')) {
      lines = data.split('\n')
    } else if (data.includes('\r')) {
      lines = data.split('\r')
    } else {
      // For continuous data, split by AAMVA field identifiers
      lines = data.split(/(?=D[A-Z]{2})/g)
    }
    
    const parsed: Partial<IDScannerData> = { isValid: true }

    lines.forEach(line => {
      const trimmedLine = line.trim()
      console.log('Processing line:', trimmedLine)
      
      // AAMVA standard fields
      if (trimmedLine.startsWith('DAA')) parsed.fullName = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAB')) parsed.lastName = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAC')) parsed.firstName = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAD')) parsed.middleName = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAG')) parsed.streetAddress = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAH')) parsed.streetAddress2 = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAI')) parsed.city = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAJ')) parsed.state = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAK')) parsed.zipCode = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DAQ')) parsed.licenseNumber = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DBB')) parsed.dateOfBirth = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DBC')) parsed.gender = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DBD')) parsed.issueDate = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DBA')) parsed.expirationDate = trimmedLine.substring(3).trim()
      if (trimmedLine.startsWith('DCS')) parsed.customerIdNumber = trimmedLine.substring(3).trim()
      
      // North Carolina specific fields (if any)
      if (trimmedLine.startsWith('ZCZ')) parsed.ncSpecificField = trimmedLine.substring(3).trim()
    })

    // Format the full name if not provided but first/last are available
    if (!parsed.fullName && (parsed.firstName || parsed.lastName)) {
      parsed.fullName = [parsed.firstName, parsed.middleName, parsed.lastName]
        .filter(Boolean)
        .join(' ')
    }

    console.log('Final parsed data:', parsed)
    return parsed
  }

  const handleManualSubmit = () => {
    if (manualData.trim()) {
      const parsedData = parseDriverLicenseData(manualData.trim())
      if (parsedData && Object.keys(parsedData).length > 0) {
        onScanComplete({ ...parsedData, isValid: parsedData.isValid ?? true } as IDScannerData)
      } else {
        setError('Could not parse the manual data. Please check the format.')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-text">Scan Driver License</h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {error ? (
            <div className="bg-error/10 border border-error/20 rounded-lg p-4 text-center">
              <p className="text-error text-sm">{error}</p>
              <button
                onClick={startScanning}
                className="mt-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-64 bg-black rounded-lg object-cover"
                playsInline
                muted
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary rounded-lg w-3/4 h-3/4 opacity-50"></div>
                </div>
              )}
            </div>
          )}

          <div className="text-center">
            <p className="text-text-secondary text-sm mb-4">
              Position the barcode on the back of the driver's license within the frame
            </p>
            
            {showManualInput ? (
              <div className="space-y-3 mb-4">
                <textarea
                  value={manualData}
                  onChange={(e) => setManualData(e.target.value)}
                  placeholder="Paste the raw barcode data here..."
                  className="w-full h-24 p-3 bg-background-tertiary border border-background-tertiary rounded-lg text-text text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowManualInput(false)}
                    className="flex-1 bg-background-tertiary hover:bg-background-tertiary/80 text-text py-2 rounded-lg transition-colors text-sm"
                  >
                    Back to Camera
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors text-sm"
                  >
                    Parse Data
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowManualInput(true)}
                  className="flex-1 bg-background-tertiary hover:bg-background-tertiary/80 text-text py-2 rounded-lg transition-colors text-sm"
                >
                  Manual Input
                </button>
                {!isScanning && !error && (
                  <button
                    onClick={startScanning}
                    className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 rounded-lg transition-colors text-sm"
                  >
                    Start Scan
                  </button>
                )}
              </div>
            )}
            
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 bg-background-tertiary hover:bg-background-tertiary/80 text-text py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IDScanner 