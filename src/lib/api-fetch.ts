/**
 * Custom fetch wrapper that automatically adds API environment header
 * This ensures ALL API calls respect the Docker/Production toggle
 */

/**
 * Get the current API environment from localStorage
 */
function getApiEnvironment(): string {
  if (typeof window === 'undefined') return 'production';
  return localStorage.getItem('flora_pos_api_environment') || 'production';
}

/**
 * Custom fetch that automatically adds x-api-environment header
 * Use this instead of regular fetch() for ALL API calls
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const apiEnv = getApiEnvironment();
  
  // Clone or create headers
  const headers = new Headers(init?.headers || {});
  
  // Add the API environment header
  headers.set('x-api-environment', apiEnv);
  
  // Log for debugging
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  console.log(`🔄 [${apiEnv.toUpperCase()}] Fetching:`, url);
  
  // Make the request with updated headers
  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Export a version for React Query that can be used as a fetcher
 */
export const apiFetcher = async (url: string) => {
  const response = await apiFetch(url);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

