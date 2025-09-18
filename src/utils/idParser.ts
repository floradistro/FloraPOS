/**
 * USA State ID Barcode Parser
 * Parses PDF417 barcodes from US state driver's licenses and ID cards
 */

export interface ParsedIDData {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  email?: string;
  phone?: string;
}

/**
 * Parse AAMVA compliant ID barcode data
 * Most US states follow AAMVA (American Association of Motor Vehicle Administrators) standards
 */
export function parseAAMVAData(barcodeData: string): ParsedIDData | null {
  try {
    // AAMVA barcodes typically start with @\n\x1e or similar control characters
    const lines = barcodeData.split('\n');
    const data: Partial<ParsedIDData> = {};
    
    // Common AAMVA field mappings
    const fieldMappings: Record<string, keyof ParsedIDData> = {
      'DAC': 'firstName',     // First Name
      'DCS': 'lastName',      // Last Name  
      'DAG': 'address',       // Street Address
      'DAI': 'city',          // City
      'DAJ': 'state',         // State
      'DAK': 'zipCode',       // ZIP Code
      'DBB': 'dateOfBirth',   // Date of Birth (MMDDYYYY)
      'DAQ': 'licenseNumber', // License Number
    };

    // Parse each line looking for AAMVA field codes
    for (const line of lines) {
      for (const [code, field] of Object.entries(fieldMappings)) {
        if (line.startsWith(code)) {
          const value = line.substring(3).trim(); // Remove 3-char code
          if (value) {
            data[field] = value;
          }
        }
      }
    }

    // Format date of birth if present
    if (data.dateOfBirth && data.dateOfBirth.length === 8) {
      const dob = data.dateOfBirth;
      data.dateOfBirth = `${dob.substring(0,2)}/${dob.substring(2,4)}/${dob.substring(4,8)}`;
    }

    // Ensure we have minimum required fields
    if (data.firstName && data.lastName) {
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        dateOfBirth: data.dateOfBirth,
        licenseNumber: data.licenseNumber,
        email: data.email,
        phone: data.phone
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing AAMVA data:', error);
    return null;
  }
}

/**
 * Parse various state-specific formats
 * Some states may have slightly different formats
 */
export function parseStateSpecificData(barcodeData: string, state?: string): ParsedIDData | null {
  try {
    // First try standard AAMVA parsing
    const aamvaResult = parseAAMVAData(barcodeData);
    if (aamvaResult) return aamvaResult;

    // Fallback parsing for non-standard formats
    const lines = barcodeData.split(/[\n\r]+/);
    const data: Partial<ParsedIDData> = {};

    // Try to extract common patterns
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for name patterns
      if (!data.firstName && !data.lastName) {
        // Pattern: "LAST,FIRST" or "LAST, FIRST"
        const nameMatch = trimmedLine.match(/^([A-Z\s]+),\s*([A-Z\s]+)$/);
        if (nameMatch) {
          data.lastName = nameMatch[1].trim();
          data.firstName = nameMatch[2].trim();
          continue;
        }
      }

      // Look for address patterns
      if (!data.address && /^\d+\s+[A-Z\s]+/.test(trimmedLine)) {
        data.address = trimmedLine;
        continue;
      }

      // Look for city, state, zip patterns
      if (!data.city && !data.state && !data.zipCode) {
        const cityStateZipMatch = trimmedLine.match(/^([A-Z\s]+),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)$/);
        if (cityStateZipMatch) {
          data.city = cityStateZipMatch[1].trim();
          data.state = cityStateZipMatch[2].trim();
          data.zipCode = cityStateZipMatch[3].trim();
          continue;
        }
      }

      // Look for date patterns (DOB)
      if (!data.dateOfBirth) {
        const dateMatch = trimmedLine.match(/(\d{2}\/\d{2}\/\d{4})|(\d{8})/);
        if (dateMatch) {
          data.dateOfBirth = dateMatch[1] || 
            `${dateMatch[2].substring(0,2)}/${dateMatch[2].substring(2,4)}/${dateMatch[2].substring(4,8)}`;
          continue;
        }
      }
    }

    // Return parsed data if we have minimum requirements
    if (data.firstName && data.lastName) {
      return {
        firstName: data.firstName,
        lastName: data.lastName,
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        dateOfBirth: data.dateOfBirth,
        licenseNumber: data.licenseNumber,
        email: data.email,
        phone: data.phone
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing state-specific data:', error);
    return null;
  }
}

/**
 * Main parser function that tries multiple parsing strategies
 */
export function parseIDBarcode(barcodeData: string): ParsedIDData | null {
  if (!barcodeData || typeof barcodeData !== 'string') {
    return null;
  }

  // Try AAMVA standard format first
  let result = parseAAMVAData(barcodeData);
  if (result) return result;

  // Try state-specific parsing as fallback
  result = parseStateSpecificData(barcodeData);
  if (result) return result;

  console.warn('Could not parse ID barcode data:', barcodeData.substring(0, 100) + '...');
  return null;
}

/**
 * Validate that parsed data looks reasonable
 */
export function validateParsedData(data: ParsedIDData): boolean {
  // Check required fields
  if (!data.firstName?.trim() || !data.lastName?.trim()) {
    return false;
  }

  // Check name format (should be mostly letters)
  const namePattern = /^[A-Za-z\s\-'\.]+$/;
  if (!namePattern.test(data.firstName) || !namePattern.test(data.lastName)) {
    return false;
  }

  // Check state format if present (should be 2 letters)
  if (data.state && !/^[A-Z]{2}$/.test(data.state)) {
    return false;
  }

  // Check zip code format if present
  if (data.zipCode && !/^\d{5}(-\d{4})?$/.test(data.zipCode)) {
    return false;
  }

  return true;
}
