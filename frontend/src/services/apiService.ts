import axios, { AxiosInstance } from 'axios';
import { ConversionResponse, UploadResponse, ApiError } from '../types';

// Determine API base URL from root .env or use smart default
const getApiBaseUrl = (): string => {
  // In development: frontend on :3000, backend on :5000
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // In production: same host, different port or path
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:5000`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 600000, // 10 minutes for large batch processing
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Convert CSV file to JSON
   */
  async convertCsvToJson(file: File): Promise<ConversionResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post<ConversionResponse>(
        '/api/convert/convert-file',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Preview CSV conversion (first 5 records)
   */
  async previewCsvConversion(file: File): Promise<ConversionResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post<ConversionResponse>(
        '/api/convert/preview',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload CSV file to database
   */
  async uploadCsv(file: File): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await this.api.post<UploadResponse>(
        '/api/embed/upload-csv',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Store resume records and generate embeddings
   */
  async storeAndEmbed(records: any[]): Promise<any> {
    try {
      // Validate records
      if (!Array.isArray(records) || records.length === 0) {
        console.error('Invalid records input:', records);
        throw new Error('No records to embed. Please convert CSV to JSON first.');
      }

      console.log(`[DEBUG] Received ${records.length} records for embedding`);

      // Prepare records with default values
      const preparedRecords = records.map((record, idx) => {
        const prepared = {
          name: record.name || 'Unknown',
          email: record.email || `unknown-${Date.now()}-${idx}@email.com`,
          phone: record.phone || '',
          location: record.location || '',
          company: record.company || '',
          role: record.role || '',
          education: record.education || '',
          totalExperience: typeof record.totalExperience === 'number' ? record.totalExperience : 0,
          relevantExperience: typeof record.relevantExperience === 'number' ? record.relevantExperience : 0,
          skills: Array.isArray(record.skills) ? record.skills : (record.skills ? [record.skills] : []),
          text: record.text || '',
        };
        return prepared;
      });

      console.log(`[DEBUG] Prepared ${preparedRecords.length} records for API call`);
      console.log('[DEBUG] First record sample:', preparedRecords[0]);

      const payload = { records: preparedRecords };
      console.log(`[DEBUG] Payload size: ${JSON.stringify(payload).length} bytes`);

      const response = await this.api.post(
        '/api/store-embed/store-and-embed',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('[DEBUG] Embedding response received:', response.status);
      return response.data;
    } catch (error) {
      console.error('[DEBUG] Embedding error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get embedding status and statistics
   */
  async getEmbeddingStatus(): Promise<any> {
    try {
      const response = await this.api.get('/api/store-embed/status');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get resume with embeddings by ID
   */
  async getResumeWithEmbeddings(id: string): Promise<any> {
    try {
      const response = await this.api.get(`/api/store-embed/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete resume by ID
   */
  async deleteResume(id: string): Promise<any> {
    try {
      const response = await this.api.delete(`/api/store-embed/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as ApiError | undefined;
      const errorMessage = data?.message || error.message || 'An error occurred';
      console.error('API Error Response:', data);
      return {
        status: 'error',
        message: errorMessage,
        statusCode: error.response?.status,
        details: data?.details,
      };
    }

    return {
      status: 'error',
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export default new ApiService();
