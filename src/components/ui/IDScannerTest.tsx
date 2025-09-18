'use client';

import React, { useState } from 'react';
import { IDScanner, ScannedIDData } from './IDScanner';

/**
 * Test component for ID Scanner functionality
 * This can be used to validate scanning works correctly
 */
export function IDScannerTest() {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<ScannedIDData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDataScanned = (data: ScannedIDData) => {
    setScannedData(data);
    setError(null);
    console.log('Scanned ID Data:', data);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('ID Scanner Error:', errorMessage);
  };

  const testData: ScannedIDData = {
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'Michael',
    address: '123 Main Street',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345',
    dateOfBirth: '01/15/1990',
    licenseNumber: 'D1234567',
    expirationDate: '01/15/2025',
    sex: 'M',
    height: '6-00',
    weight: '180',
    eyeColor: 'BRO',
    hairColor: 'BRN'
  };

  return (
    <div className="p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-xl font-bold text-white mb-4">ID Scanner Test</h2>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => setShowScanner(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Test Real Scanner
          </button>
          
          <button
            onClick={() => handleDataScanned(testData)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Test with Sample Data
          </button>
          
          <button
            onClick={() => {
              setScannedData(null);
              setError(null);
            }}
            className="px-4 py-2 bg-neutral-600 hover:bg-neutral-500 text-white rounded-lg transition-colors"
          >
            Clear Results
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-600/10 border border-red-600/20 rounded-lg">
            <h3 className="text-red-400 font-medium mb-2">Error:</h3>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {scannedData && (
          <div className="p-4 bg-green-600/10 border border-green-600/20 rounded-lg">
            <h3 className="text-green-400 font-medium mb-3">Scanned Data:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-400">First Name:</span>
                <span className="text-white ml-2">{scannedData.firstName}</span>
              </div>
              <div>
                <span className="text-neutral-400">Last Name:</span>
                <span className="text-white ml-2">{scannedData.lastName}</span>
              </div>
              {scannedData.middleName && (
                <div>
                  <span className="text-neutral-400">Middle Name:</span>
                  <span className="text-white ml-2">{scannedData.middleName}</span>
                </div>
              )}
              <div>
                <span className="text-neutral-400">Address:</span>
                <span className="text-white ml-2">{scannedData.address}</span>
              </div>
              <div>
                <span className="text-neutral-400">City:</span>
                <span className="text-white ml-2">{scannedData.city}</span>
              </div>
              <div>
                <span className="text-neutral-400">State:</span>
                <span className="text-white ml-2">{scannedData.state}</span>
              </div>
              <div>
                <span className="text-neutral-400">ZIP Code:</span>
                <span className="text-white ml-2">{scannedData.zipCode}</span>
              </div>
              {scannedData.dateOfBirth && (
                <div>
                  <span className="text-neutral-400">Date of Birth:</span>
                  <span className="text-white ml-2">{scannedData.dateOfBirth}</span>
                </div>
              )}
              {scannedData.licenseNumber && (
                <div>
                  <span className="text-neutral-400">License #:</span>
                  <span className="text-white ml-2">{scannedData.licenseNumber}</span>
                </div>
              )}
              {scannedData.expirationDate && (
                <div>
                  <span className="text-neutral-400">Expires:</span>
                  <span className="text-white ml-2">{scannedData.expirationDate}</span>
                </div>
              )}
              {scannedData.sex && (
                <div>
                  <span className="text-neutral-400">Sex:</span>
                  <span className="text-white ml-2">{scannedData.sex}</span>
                </div>
              )}
              {scannedData.height && (
                <div>
                  <span className="text-neutral-400">Height:</span>
                  <span className="text-white ml-2">{scannedData.height}</span>
                </div>
              )}
              {scannedData.weight && (
                <div>
                  <span className="text-neutral-400">Weight:</span>
                  <span className="text-white ml-2">{scannedData.weight}</span>
                </div>
              )}
              {scannedData.eyeColor && (
                <div>
                  <span className="text-neutral-400">Eye Color:</span>
                  <span className="text-white ml-2">{scannedData.eyeColor}</span>
                </div>
              )}
              {scannedData.hairColor && (
                <div>
                  <span className="text-neutral-400">Hair Color:</span>
                  <span className="text-white ml-2">{scannedData.hairColor}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <IDScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onDataScanned={handleDataScanned}
        onError={handleError}
      />
    </div>
  );
}
