import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
});

function serializeRequestData(data: unknown) {
  if (!data) {
    return undefined;
  }

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return '[FormData]';
  }

  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  return data;
}

// Request interceptor to add access token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    // Log API request details
    const requestDetails: any = {};
    const body = serializeRequestData(config.data);
    if (body) requestDetails.body = body;
    if (config.params) requestDetails.params = config.params;
    
    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.url || ''}`,
      Object.keys(requestDetails).length > 0 ? requestDetails : ''
    );
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh & logging
api.interceptors.response.use(
  (response) => {
    // Log API response details
    console.log(
      `[API Response] ${response.config.method?.toUpperCase()} ${response.config.url || ''} - Status: ${response.status}`,
      response.data ? { responseBody: response.data } : ''
    );
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    const requestPayload = originalRequest?.data ? JSON.parse(originalRequest.data) : undefined;
    
    console.error(
      `[API Error] ${originalRequest?.method?.toUpperCase() || 'UNKNOWN'} ${originalRequest?.url || ''} - Status: ${error.response?.status}`,
      requestPayload ? { requestBody: requestPayload } : ''
    );
    if (error.response?.data) console.error('Error Data:', error.response.data);

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const errorId = error.response?.data?.error_id;

      // If token expired, try to refresh
      if (errorId === 'AUTH_TOKEN_EXPIRED' && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh-token`,
            {},
            { withCredentials: true }
          );

          const { access_token } = response.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth';
          }
          return Promise.reject(refreshError);
        }
      }

      // For other 401 errors (e.g., AUTH_UNAUTHORIZED, AUTH_INVALID_TOKEN)
      // or if refresh token logic above wasn't triggered/failed
      if (errorId === 'AUTH_UNAUTHORIZED' || errorId === 'AUTH_INVALID_TOKEN' || !errorId) {
        localStorage.removeItem('access_token');
        if (typeof window !== 'undefined') {
          // Prevent infinite redirect loops if already on auth page
          if (!window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth';
          }
        }
      }
    }

    return Promise.reject(error);

  }
);

export default api;
