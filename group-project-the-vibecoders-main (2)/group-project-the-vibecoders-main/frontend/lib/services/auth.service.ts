import api from '../api/axios';
import { 
  RegisterRequest, 
  RegisterResponse, 
  VerifyOtpRequest, 
  VerifyOtpResponse, 
  LoginRequest, 
  LoginResponse, 
  User 
} from '@/types/auth';

const authService = {
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  async verifyRegisterOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await api.post<VerifyOtpResponse>('/auth/verify-register-otp', data);
    return response.data;
  },

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('current_user', JSON.stringify(response.data.user));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-changed'));
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  }
};

export default authService;
