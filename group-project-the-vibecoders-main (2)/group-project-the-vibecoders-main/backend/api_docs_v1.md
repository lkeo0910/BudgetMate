# API Documentation - Transaction & Category Modules

This document provides a comprehensive overview of the Category and Transaction API endpoints, including request formats, success responses, and common failure scenarios.

## Global Configuration

- **Base URL**: `/api/v1`
- **Authentication**: Bearer Token (JWT) required for all endpoints.
- **Success Format**: JSON response as defined below.
- **Error Response Structure**:
  ```json
  {
    "error_id": "STRING_ERROR_ID",
    "message": "Human readable error message",
    "status_code": 400
  }
  ```

---

## Category Module (`/users/categories`)

Manage budget categories.

### 1. Get All Categories
Retrieve all categories belonging to the authenticated user.

- **Method**: `GET`
- **Endpoint**: `/users/categories`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "uuid",
      "user_id": "uuid",
      "category_name": "Food",
      "monthly_limit": 500.0,
      "created_at": "ISO-8601-DateTime",
      "updated_at": "ISO-8601-DateTime"
    }
  ]
  ```

### 2. Create Category
Add a new category.

- **Method**: `POST`
- **Endpoint**: `/users/categories`
- **Request Body**:
  ```json
  {
    "category_name": "Entertainment",
    "monthly_limit": 200.0
  }
  ```
- **Response (201 Created)**: `CategoryResponse` object.
- **Errors**:
  - `400 Bad Request` (`CATEGORY_ALREADY_EXISTS`): Category name already exists for this user.
  - `422 Unprocessable Entity`: Validation error (e.g., missing name).

### 3. Update Category
Update an existing category.

- **Method**: `PUT`
- **Endpoint**: `/users/categories/{category_id}`
- **Request Body** (optional fields):
  ```json
  {
    "category_name": "Revised Name",
    "monthly_limit": 300.0
  }
  ```
- **Response (200 OK)**: Updated `CategoryResponse`.
- **Errors**:
  - `404 Not Found` (`CATEGORY_NOT_FOUND`): Category ID does not exist or does not belong to user.

### 4. Delete Category
Remove a category.

- **Method**: `DELETE`
- **Endpoint**: `/users/categories/{category_id}`
- **Response (204 No Content)**: Empty body.
- **Errors**:
  - `404 Not Found` (`CATEGORY_NOT_FOUND`)

---

## Transaction Module (`/transactions`)

Manage income and expense records.

### 1. OCR Receipt
Extract transaction hints from an uploaded receipt image or PDF.

- **Method**: `POST`
- **Endpoint**: `/transactions/receipt-ocr`
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Receipt file (`.pdf`, `.jpg`, `.jpeg`, `.png`, `.webp`)
- **Response (200 OK)**:
  ```json
  {
    "vendor": "Highlands Coffee",
    "amount": 65000,
    "date": "2026-04-14",
    "time": "08:35",
    "confidence": 85,
    "rawText": "..."
  }
  ```
- **Errors**:
  - `400 Bad Request` (`OCR_UNSUPPORTED_FILE`): Unsupported file format.
  - `413 Request Entity Too Large` (`OCR_FILE_TOO_LARGE`): File exceeds 5MB.
  - `502 Bad Gateway` (`OCR_PROCESSING_FAILED`): OCR provider failed to scan the receipt.
  - `503 Service Unavailable` (`OCR_NOT_CONFIGURED`): Missing OCR API key on the server.

### 2. Create Transaction
Record a new transaction.

- **Method**: `POST`
- **Endpoint**: `/transactions/`
- **Request Body**:
  ```json
  {
    "vendor": "Starbucks",
    "category_id": "uuid",
    "amount": 5.50,
    "date": "YYYY-MM-DD",
    "type": "EXPENSE",
    "notes": "Morning coffee"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "id": "uuid",
    "vendor": "Starbucks",
    "category_id": "uuid",
    "amount": 5.50,
    "date": "YYYY-MM-DD",
    "type": "EXPENSE",
    "notes": "Morning coffee"
  }
  ```

### 3. Get All Transactions
List transactions with optional filtering and pagination.

- **Method**: `GET`
- **Endpoint**: `/transactions/`
- **Query Parameters**:
  - `search`: Search in vendor or notes.
  - `type`: `INCOME` or `EXPENSE`.
  - `categoryId`: Filter by specific category UUID.
  - `dateFrom`: Start date (YYYY-MM-DD).
  - `dateTo`: End date (YYYY-MM-DD).
  - `minAmount`: Minimum amount.
  - `maxAmount`: Maximum amount.
  - `page`: Page number (default: 1).
  - `size`: Page size (default: 20).
  - `orderBy`: Field to sort by (`date`, `amount`, `vendor`) (default: `date`).
  - `order`: Sort order (`asc`, `desc`) (default: `desc`).
- **Response (200 OK)**:
  ```json
  {
    "items": [...],
    "total": 100,
    "page": 1,
    "size": 20,
    "pages": 5
  }
  ```

### 4. Update Transaction
Modify a specific transaction.

- **Method**: `PUT`
- **Endpoint**: `/transactions/{transaction_id}`
- **Request Body** (optional fields):
  ```json
  {
    "amount": 10.0,
    "notes": "Updated note"
  }
  ```
- **Response (200 OK)**: Updated `TransactionResponse`.
- **Errors**:
  - `404 Not Found` (`TRANSACTION_NOT_FOUND`)

### 5. Delete Transaction
Remove a transaction record.

- **Method**: `DELETE`
- **Endpoint**: `/transactions/{transaction_id}`
- **Response (204 No Content)**: Empty body.

---

## Error Catalog

| Error ID | Status Code | Description |
| :--- | :--- | :--- |
| `CATEGORY_ALREADY_EXISTS` | 400 | A category with this name already exists for the user. |
| `CATEGORY_NOT_FOUND` | 404 | The requested category was not found or belongs to another user. |
| `OCR_FILE_TOO_LARGE` | 413 | Uploaded receipt file is larger than 5MB. |
| `OCR_NOT_CONFIGURED` | 503 | OCR API key is missing on the backend. |
| `OCR_PROCESSING_FAILED` | 502 | Receipt OCR provider could not process the file. |
| `OCR_UNSUPPORTED_FILE` | 400 | Uploaded receipt format is not supported. |
| `TRANSACTION_NOT_FOUND` | 404 | The requested transaction was not found. |
| `VALIDATION_ERROR` | 422 | The request body or parameters fail validation rules. |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token. |
