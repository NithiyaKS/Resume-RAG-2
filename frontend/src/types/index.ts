export interface Resume {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  education: string;
  totalExperience: number;
  relevantExperience: number;
  skills: string[];
  text: string;
}

export interface ConversionResponse {
  status: string;
  message: string;
  totalRows?: number;
  totalRowsInFile?: number;
  convertedRecords?: number;
  previewRecords?: number;
  data: Resume[];
}

export interface UploadResponse {
  status: string;
  message: string;
  recordsProcessed: number;
  recordsSaved: number;
  data?: {
    resumeIds: string[];
  };
}

export interface ApiError {
  status: string;
  message: string;
  statusCode?: number;
  details?: string;
}

export interface EmbeddingResult {
  name: string;
  email: string;
  status: 'completed' | 'failed';
  embeddingDimension?: number;
  error?: string;
}

export interface EmbeddingResponse {
  totalRecords: number;
  successCount: number;
  failureCount: number;
  results: EmbeddingResult[];
}

export interface StatusResponse {
  totalResumes: number;
  embeddedCount: number;
  pendingCount: number;
  failedCount: number;
  completionPercentage: string;
  recentResumes: Array<{
    id: string;
    name: string;
    email: string;
    embeddingStatus: 'pending' | 'completed' | 'failed';
    createdAt: string;
  }>;
}
