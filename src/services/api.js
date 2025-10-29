import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data?.error || 'Server error';
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - please check your connection');
    } else {
      // Something else happened
      throw new Error(error.message || 'Unknown error occurred');
    }
  }
);

/**
 * Fetch all available job titles
 * @returns {Promise<Array<string>>} Array of job titles
 */
export async function fetchJobs() {
  try {
    const response = await api.get('/jobs');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw error;
  }
}

/**
 * Fetch candidates with search, filtering, and pagination
 * @param {Object} params - Search parameters
 * @param {string} params.q - Search query
 * @param {string} params.jobId - Job title filter
 * @param {string} params.fromDate - Start date filter (YYYY-MM-DD)
 * @param {string} params.toDate - End date filter (YYYY-MM-DD)
 * @param {string} params.sort - Sort field (full_name, job_title, created_at)
 * @param {string} params.dir - Sort direction (asc, desc)
 * @param {number} params.page - Page number
 * @param {number} params.limit - Items per page
 * @returns {Promise<Object>} Response with data and pagination info
 */
export async function fetchCandidates(params = {}) {
  try {
    // Build query string from params
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });

    const response = await api.get(`/candidates?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }
}

/**
 * Trigger manual sync from CEIPAL
 * @returns {Promise<Object>} Sync result
 */
export async function triggerSync() {
  try {
    const response = await api.post('/internal/sync');
    return response.data;
  } catch (error) {
    console.error('Error triggering sync:', error);
    throw error;
  }
}

/**
 * Health check
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking health:', error);
    throw error;
  }
}
