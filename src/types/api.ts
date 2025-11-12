// ML Model API Types
export interface MLPredictRequest {
  raw_email: string;
}

export interface MLPredictResponse {
  is_phishing: boolean;
  phishing_probability: number; // 0.0-1.0 probability from ML model
  confidence?: number; // Optional, for backward compatibility
  indicators?: string[];
  details?: Record<string, any>;
}

// PhishWatch Backend API Types
export interface HeaderEncryption {
  nonce_b64: string;
  ciphertext_b64: string;
}

export interface AnalysisResult {
  is_phishing: boolean;
  confidence: number; // 0.0-1.0
  source: string;
}

export interface Analysis {
  _id: string;
  user_sub: string;
  header_enc: HeaderEncryption | null;
  eml_file_id: string | null;
  status: 'pending' | 'completed' | 'failed';
  result: AnalysisResult | null;
}

export interface SubmitHeaderRequest {
  header_text: string;
}

export interface SubmitHeaderResponse extends Analysis {}

export interface UploadFileResponse extends Analysis {}

// UI Types
export interface AnalysisResultUI {
  isPhishing: boolean;
  confidence: number; // 0-100
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  details: Record<string, any>;
}


