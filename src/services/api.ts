import type {
  MLPredictRequest,
  MLPredictResponse,
  SubmitHeaderRequest,
  SubmitHeaderResponse,
  UploadFileResponse,
  Analysis,
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

// PhishWatch Backend Service
export const backendService = {
  submitHeader: async (headerText: string, token?: string): Promise<SubmitHeaderResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const authToken = token ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('phishsafe_token') : null);
      const response = await fetch(`${BACKEND_URL}/analysis/header`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ header_text: headerText } as SubmitHeaderRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<SubmitHeaderResponse>(response);
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

  uploadFile: async (file: File, token?: string): Promise<UploadFileResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s for file uploads

    try {
      const formData = new FormData();
      formData.append('file', file);

      const authToken = token ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('phishsafe_token') : null);

      const response = await fetch(`${BACKEND_URL}/analysis/file`, {
        method: 'POST',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<UploadFileResponse>(response);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Upload timeout. Please try again.');
      }
      if (error.message) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  },

  getAnalyses: async (token?: string): Promise<Analysis[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const authToken = token ?? (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('phishsafe_token') : null);
      const response = await fetch(`${BACKEND_URL}/analysis/`, {
        method: 'GET',
        headers: {
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return handleResponse<Analysis[]>(response);
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
      const response = await fetch(`${BACKEND_URL}/analysis/${analysisId}`, {
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
