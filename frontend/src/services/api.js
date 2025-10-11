/**
 * API service layer for the Sovereign Financial Cockpit frontend.
 * Provides centralized API communication with error handling and retry logic.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
    
    // Request/Response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  /**
   * Add request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Process request through interceptors
   */
  async processRequest(url, options) {
    let processedOptions = { ...options };
    
    for (const interceptor of this.requestInterceptors) {
      processedOptions = await interceptor(url, processedOptions);
    }
    
    return processedOptions;
  }

  /**
   * Process response through interceptors
   */
  async processResponse(response) {
    let processedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      processedResponse = await interceptor(processedResponse);
    }
    
    return processedResponse;
  }

  /**
   * Make HTTP request with retry logic and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 1000;
    
    const defaultOptions = {
      headers: { ...this.defaultHeaders },
      ...options
    };

    // Process request through interceptors
    const processedOptions = await this.processRequest(url, defaultOptions);

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, processedOptions);
        const processedResponse = await this.processResponse(response);
        
        if (!processedResponse.ok) {
          const errorData = await this.safeJsonParse(processedResponse);
          throw new ApiError(
            errorData.error || `HTTP ${processedResponse.status}`,
            processedResponse.status,
            errorData
          );
        }

        return await this.safeJsonParse(processedResponse);
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on client errors (4xx) or if it's the last attempt
        if (error.status && error.status < 500 || attempt === maxRetries) {
          break;
        }
        
        // Wait before retry
        if (attempt < maxRetries) {
          await this.delay(retryDelay * Math.pow(2, attempt)); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Safely parse JSON response
   */
  async safeJsonParse(response) {
    try {
      const text = await response.text();
      return text ? JSON.parse(text) : {};
    } catch {
      return response;
    }
  }

  /**
   * Delay utility for retries
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET'
    });
  }

  /**
   * POST request with JSON body
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * POST request with form data
   */
  async postForm(endpoint, formData) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {}, // Let browser set content-type for FormData
      body: formData
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint, file, additionalData = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    // Add additional form fields
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new ApiError(
            `Upload failed: ${xhr.statusText}`,
            xhr.status
          ));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new ApiError('Upload failed: Network error', 0));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      xhr.send(formData);
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Add authentication interceptor
apiService.addRequestInterceptor(async (url, options) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  return options;
});

// Add response error logging
apiService.addResponseInterceptor(async (response) => {
  if (!response.ok) {
    console.error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response;
});

// Specific API endpoints
export const api = {
  // Health check
  health: () => apiService.get('/health'),
  
  // Bill processing
  endorseBill: (file) => apiService.uploadFile('/endorse-bill', file),
  
  stampEndorsement: (file, x, y, endorsementText, qualifier) => 
    apiService.uploadFile('/stamp_endorsement', file, {
      x, y, endorsement_text: endorsementText, qualifier
    }),
  
  getBillData: (file) => apiService.uploadFile('/get-bill-data', file),
  
  scanForTerms: (file, tag) => 
    apiService.uploadFile('/scan-for-terms', file, { tag }),
  
  // Letter generation
  generateTenderLetter: (data) => 
    apiService.post('/generate-tender-letter', data),
  
  generatePtpLetter: (data) => 
    apiService.post('/generate-ptp-letter', data),
  
  // Contract scanning
  scanContract: (filepath, tag) => 
    apiService.post('/scan-contract', { filepath, tag }),
  
  // Remedy generation
  generateRemedy: (violation, jurisdiction) => 
    apiService.postForm('/generate-remedy', 
      new URLSearchParams({ violation, jurisdiction })),
  
  // Profile management (assuming these endpoints exist)
  getProfile: () => apiService.get('/api/profile'),
  updateProfile: (data) => apiService.put('/api/profile', data),
  
  // Document management
  getDocuments: () => apiService.get('/api/documents'),
  uploadDocument: (file, type) => 
    apiService.uploadFile('/api/documents', file, { type }),
  
  // Authentication (assuming these endpoints exist)
  login: (credentials) => apiService.post('/api/auth/login', credentials),
  logout: () => apiService.post('/api/auth/logout'),
  register: (userData) => apiService.post('/api/auth/register', userData),
  
  // Credit report
  uploadCreditReport: (file) => 
    apiService.uploadFile('/api/credit-report', file),
  
  // Disputes
  getDisputes: () => apiService.get('/api/disputes'),
  createDispute: (data) => apiService.post('/api/disputes', data),
  
  // Vehicle information
  getVehicleInfo: () => apiService.get('/api/vehicle'),
  updateVehicleInfo: (data) => apiService.put('/api/vehicle', data),
};

// Error handling utility
export const handleApiError = (error, showError) => {
  console.error('API Error:', error);
  
  if (error instanceof ApiError) {
    showError(error.message);
  } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
    showError('Network error. Please check your connection.');
  } else {
    showError('An unexpected error occurred. Please try again.');
  }
};

export { ApiError, apiService };
export default api;