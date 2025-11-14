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
  id: string;
  userSub: string;
  userEmail: string;
  inputType: 'url' | 'header' | 'eml';
  inputContent: string;
  analysisContext?: Record<string, unknown> | null;
  mlResult: {
    is_phishing: boolean;
    phishing_probability: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Encrypted version of Analysis (as stored in backend)
export interface EncryptedAnalysis {
  id: string;
  userSub: string;
  userEmail: string; // Encrypted JSON string
  inputType: 'url' | 'header' | 'eml';
  inputContent: string; // Encrypted JSON string
  analysisContext?: string | null; // Encrypted JSON string
  mlResult: string; // Encrypted JSON string
  createdAt: string;
  updatedAt: string;
}

// User salt for key derivation
export interface UserSalt {
  userSub: string;
  salt: string; // Base64 encoded salt
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
