# Authentication API Documentation

This document provides technical details for integrating the authentication flow into the frontend.

## Global Configuration

### Base URL
`http://localhost:8000/api/v1/auth`

### Axios Setup
For all authentication-related requests, you **must** enable `withCredentials` to allow the browser to handle HTTP-only cookies (specifically for the `refresh_token`).

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true, // Required for cookies
});

// Attach access token to headers if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 1. Register
Initial step of the registration process. This endpoint validates the user data and sends an OTP to the provided email. The user is **not** created in the database yet; their data is temporarily cached in Redis.

- **Method**: `POST`
- **URL**: `/register`
- **Auth Required**: No

### Request Body
| Field | Type | Description |
| :--- | :--- | :--- |
| `username` | `string` | Unique username. |
| `email` | `string` | Valid email address. |
| `password` | `string` | Must be at least 6 characters long and include at least one letter, one number, and one special character. |
| `profile_avatar` | `string` | (Optional) URL or base64. |
| `phone_number` | `string` | (Optional). |

### Success Response
- **Code**: `200 OK`
- **Content**: 
  ```json
  {
    "message": "OTP sent to email."
  }
  ```

### Errors
| Status | Error ID | Message | Description |
| :--- | :--- | :--- | :--- |
| `400` | `USER_ALREADY_EXIST` | Username or email already registered | The user already exists in the permanent database. |
| `422` | `VALIDATION_ERROR` | (Specific field error) | Invalid email format or password complexity failed. |

### Axios Example
```javascript
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    console.log(response.data.message);
  } catch (error) {
    console.error(error.response.data.message);
  }
};
```

---

## 2. Verify Registration OTP
Final step of registration. Validates the OTP and persists the user to the database.

- **Method**: `POST`
- **URL**: `/verify-register-otp`
- **Auth Required**: No

### Request Body
| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The email used in the `/register` step. |
| `code` | `string` | 6-digit OTP code. |

### Success Response
- **Code**: `200 OK`
- **Content**: 
  ```json
  {
    "message": "User registered successfully. You may now log in."
  }
  ```

### Errors
| Status | Error ID | Message | Description |
| :--- | :--- | :--- | :--- |
| `404` | `USER_NOT_FOUND` | User not found | No pending registration found (likely Redis expired after 15 mins). |
| `401` | `AUTH_INVALID_OTP` | Invalid OTP code | The code provided does not match. |
| `401` | `AUTH_EXPIRED_OTP` | OTP code expired | The code was valid but used after 5 minutes. |

### Axios Example
```javascript
const verifyOtp = async (email, code) => {
  try {
    const response = await api.post('/auth/verify-register-otp', { email, code });
    alert(response.data.message);
  } catch (error) {
    alert(error.response.data.message);
  }
};
```

---

## 3. Login
Authenticates the user and initiates the session.

- **Method**: `POST`
- **URL**: `/login`
- **Auth Required**: No
- **Important**: This endpoint sets an `httponly` cookie named `refresh_token`.

### Request Body
| Field | Type | Description |
| :--- | :--- | :--- |
| `username` | `string` | Registered username. |
| `password` | `string` | Registered password. |

### Success Response
- **Code**: `200 OK`
- **Content**: 
  ```json
  {
    "access_token": "eyJhbG...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "profile_avatar": null,
      "phone_number": null
    }
  }
  ```

### Errors
| Status | Error ID | Message | Description |
| :--- | :--- | :--- | :--- |
| `401` | `AUTH_INCORRECT_PASSWORD` | Incorrect username or password | Self-explanatory. |

### Axios Example
```javascript
const login = async (username, password) => {
  try {
    const response = await api.post('/auth/login', { username, password });
    // Store access_token in memory or local storage
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.user;
  } catch (error) {
    throw error.response.data;
  }
};
```

---

## 4. Refresh Token
Obtains a new access token. This endpoint allows the frontend to stay logged in without asking for credentials again.

- **Method**: `POST`
- **URL**: `/refresh-token`
- **Auth Required**: No (Uses the `refresh_token` cookie automatically)

### Request Body
None (The browser automatically sends the `refresh_token` cookie).

### Success Response
- **Code**: `200 OK`
- **Content**: 
  ```json
  {
    "access_token": "new_eyJhbG...",
    "token_type": "bearer"
  }
  ```

### Errors
| Status | Error ID | Message | Description |
| :--- | :--- | :--- | :--- |
| `401` | `AUTH_INVALID_TOKEN` | Invalid or expired refresh token | The user must log in again. |

### Axios Example
```javascript
const refreshAccessToken = async () => {
  try {
    const response = await api.post('/auth/refresh-token');
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  } catch (error) {
    // Redirect to login page if refresh fails
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
};
```

---

## 5. Get Current User
Retrieves the profile of the currently authenticated user.

- **Method**: `GET`
- **URL**: `/api/v1/users/me`
- **Auth Required**: Yes (Bearer Token)

### Request Body
None.

### Success Response
- **Code**: `200 OK`
- **Content**: 
  ```json
  {
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "profile_avatar": null,
    "phone_number": null
  }
  ```

### Errors
| Status | Error ID | Message | Description |
| :--- | :--- | :--- | :--- |
| `401` | `AUTH_UNAUTHORIZED` | Missing or invalid authentication credentials | No token or invalid token provided. |
| `401` | `AUTH_TOKEN_EXPIRED` | Access token has expired | The token is valid but has expired. |

### Axios Example
```javascript
const getProfile = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error(error.response.data.message);
  }
};
```

---

---

## Protected Endpoints

**Every endpoint in the system is protected except for the endpoints in the `/auth` module** (e.g., `/register`, `/verify-register-otp`, `/login`, and `/refresh-token` are public).

Any request to the `/users`, `/items`, or other future modules must include a valid Bearer token.

## Exception Summary Table

| Error ID | HTTP Status | Typical Message |
| :--- | :--- | :--- |
| `USER_ALREADY_EXIST` | 400 | Username or email already registered |
| `USER_NOT_FOUND` | 404 | User not found |
| `AUTH_INCORRECT_PASSWORD`| 401 | Incorrect username or password |
| `AUTH_INVALID_OTP` | 401 | Invalid OTP code |
| `AUTH_EXPIRED_OTP` | 401 | OTP code expired |
| `AUTH_INVALID_TOKEN` | 401 | Invalid or expired refresh token |
| `AUTH_UNAUTHORIZED` | 401 | Missing or invalid authentication credentials |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token has expired |
| `VALIDATION_ERROR` | 422 | (Varies by field) |
