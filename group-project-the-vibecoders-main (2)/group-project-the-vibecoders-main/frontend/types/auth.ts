export interface User {
  id: number;
  username: string;
  email: string;
  profile_avatar?: string | null;
  phone_number?: string | null;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  profile_avatar?: string;
  phone_number?: string;
}

export interface RegisterResponse {
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  code: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
