import axios from 'axios';

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('healthvault_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth token and redirect to login
      localStorage.removeItem('healthvault_auth_token');
      localStorage.removeItem('healthvault_user_id');
      localStorage.removeItem('healthvault_user_type');
    }
    return Promise.reject(error);
  }
);

// AI Summarization API calls
export const summarizeRecord = async (recordId: string, force = false) => {
  try {
    const url = force
      ? `/summarize-record/${recordId}?force=true`
      : `/summarize-record/${recordId}`;
    const response = await apiClient.post(url);
    return response.data;
  } catch (error) {
    console.error('Error summarizing record:', error);
    throw error;
  }
};

export const summarizePatientRecords = async (patientId: string) => {
  try {
    const response = await apiClient.post(`/summarize-patient/${patientId}`);
    return response.data;
  } catch (error) {
    console.error('Error summarizing patient records:', error);
    throw error;
  }
};

export const deleteRecord = async (recordId: string) => {
  try {
    const response = await apiClient.delete(`/medical-records/${recordId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
};

export default apiClient;