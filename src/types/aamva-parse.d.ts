declare module '@digitalbazaar/aamva-parse' {
  interface ParseOptions {
    text: string;
  }

  interface ParseResult {
    // Common fields
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    family_name?: string;
    dob?: string;
    date_of_birth?: string;
    address?: string;
    street_address?: string;
    city?: string;
    state?: string;
    issuerState?: string;
    issuer_state?: string;
    zipCode?: string;
    postal_code?: string;
    zip?: string;
    docId?: string;
    license_number?: string;
    id?: string;
    expiration?: string;
    exp_date?: string;
    
    // Additional fields that may be present
    [key: string]: any;
  }

  export function parse(options: ParseOptions): ParseResult;
}
