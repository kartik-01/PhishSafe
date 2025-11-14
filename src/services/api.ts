import type {
  MLPredictRequest,
  MLPredictResponse,
  Analysis,
  EncryptedAnalysis,
} from '@/types/api';

const ML_API_URL = import.meta.env.VITE_ML_API_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Unauthorized. Please login.');
    }
    if (response.status === 404) {
      throw new Error('Resource not found.');
    }
    if (response.status === 422) {
      const error = await response.json().catch(() => ({ message: 'Validation error' }));
      throw new Error(error.message || 'Validation error');
    }
    const error = await response.json().catch(() => ({ message: 'Network error' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// ML Model Service
export const mlService = {
  predictPhishing: async (rawEmail: string): Promise<MLPredictResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      // ML API endpoint - user provided full URL with /predict
      const mlEndpoint = ML_API_URL.endsWith('/predict') 
        ? ML_API_URL 
        : `${ML_API_URL}/predict`;
      
      const response = await fetch(mlEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw_email: rawEmail } as MLPredictRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<MLPredictResponse>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  },
};

// SecureBeacon Backend Service
export const backendService = {
  saveResults: async (
    inputType: 'url' | 'header' | 'eml',
    inputContent: string, // Encrypted JSON string
    mlResult: string, // Encrypted JSON string
    userEmail: string, // Encrypted JSON string
    token: string
  ): Promise<EncryptedAnalysis> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      if (!token) {
        throw new Error('Authentication token is required');
      }


      const response = await fetch(`${BACKEND_URL}/api/saveResults`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputType,
          inputContent,
          userEmail,
          mlResult,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<EncryptedAnalysis>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  },

  getAnalyses: async (token?: string): Promise<{ items: EncryptedAnalysis[]; nextCursor: string | null }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const authToken = token ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('phishsafe_token') : null);
      const response = await fetch(`${BACKEND_URL}/api/analyses`, {
        method: 'GET',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<{ items: EncryptedAnalysis[]; nextCursor: string | null }>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  },

  getAnalysisById: async (analysisId: string, token?: string): Promise<Analysis> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const authToken = token ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('phishsafe_token') : null);
      const response = await fetch(`${BACKEND_URL}/api/analyses/${analysisId}`, {
        method: 'GET',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<Analysis>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please try again.');
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  },
};
