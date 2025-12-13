# Aurora.ai API Documentation

Complete API reference for Aurora.ai backend.

## Base URL

```
http://localhost:5000/api
```

## Authentication

API key-based authentication via environment variables. No API keys required for client requests.

## Response Format

All responses are JSON:

```json
{
  "data": {},
  "error": null,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

## Rate Limiting

- **General**: 100 requests per 15 minutes
- **Upload**: 5 uploads per minute
- **Analysis**: 10 analysis requests per minute

Headers included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Document Endpoints

### Upload Document

Upload a legal document for analysis.

**Endpoint:**
```
POST /documents/upload
```

**Request:**
```
Content-Type: multipart/form-data

Parameter: document (file)
- Accepted: PDF, DOC, DOCX
- Max size: 50MB
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "contract.pdf",
  "fileSize": 245000,
  "message": "File uploaded successfully. Processing started."
}
```

**cURL Example:**
```bash
curl -X POST \
  -F "document=@contract.pdf" \
  http://localhost:5000/api/documents/upload
```

**JavaScript Example:**
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);

const response = await fetch('http://localhost:5000/api/documents/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.sessionId);
```

---

### Get Session Status

Check processing status of a document.

**Endpoint:**
```
GET /documents/session/:sessionId
```

**Path Parameters:**
- `sessionId` (string) - Session ID from upload response

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "fileName": "contract.pdf",
  "fileSize": 245000,
  "status": "extracted",
  "documentMetadata": {
    "pageCount": 5,
    "wordCount": 2500
  },
  "uploadedAt": "2024-01-01T12:00:00Z",
  "extractionTime": 1234
}
```

**Status Values:**
- `uploaded` - File received
- `extracting` - Extracting text
- `extracted` - Text ready
- `analyzing` - AI analysis in progress
- `complete` - All processing done
- `error` - Processing failed

**cURL Example:**
```bash
curl http://localhost:5000/api/documents/session/550e8400-e29b-41d4-a716-446655440000
```

---

### Get Extracted Text

Retrieve the extracted text from a document.

**Endpoint:**
```
GET /documents/session/:sessionId/text
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "Full extracted text of the document...",
  "metadata": {
    "pageCount": 5,
    "wordCount": 2500,
    "charCount": 15000
  }
}
```

**Error Response (202):**
```json
{
  "error": "Text not yet extracted"
}
```

---

### List Active Sessions

Get all active processing sessions (development only).

**Endpoint:**
```
GET /documents/sessions
```

**Response:**
```json
{
  "activeSessions": 5,
  "sessions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "fileName": "contract.pdf",
      "status": "extracted",
      "uploadedAt": "2024-01-01T12:00:00Z"
    }
  ]
}
```

---

### Cleanup Sessions

Remove old sessions (older than 1 hour).

**Endpoint:**
```
POST /documents/cleanup
```

**Response:**
```json
{
  "cleaned": 3,
  "remaining": 2
}
```

---

## Analysis Endpoints

### Analyze Document

Trigger AI analysis of extracted document.

**Endpoint:**
```
POST /analysis/analyze
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "analyzing",
  "message": "Analysis will be performed"
}
```

**JavaScript Example:**
```javascript
const response = await fetch('http://localhost:5000/api/analysis/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sessionId: '550e8400-e29b-41d4-a716-446655440000' })
});
```

---

### Get Analysis Results

Retrieve completed analysis results.

**Endpoint:**
```
GET /analysis/results/:sessionId
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "analysis": {
    "summary": "Plain-language summary of the document...",
    "documentType": "Employment Agreement",
    "parties": ["Company Inc.", "John Doe"],
    "effectiveDate": "2024-01-01",
    "expiryDate": "2025-01-01"
  },
  "clauses": [
    {
      "text": "The employee agrees to...",
      "type": "obligation",
      "explanation": "Employee duties and responsibilities"
    }
  ],
  "riskAssessment": {
    "score": "medium",
    "reasoning": "Contains standard liability terms...",
    "topRisks": ["Unlimited liability clause", "Automatic renewal"]
  },
  "nextSteps": {
    "steps": [
      {
        "step": "Review termination clause",
        "rationale": "Ensure clear exit conditions"
      }
    ],
    "disclaimer": "Not legal advice"
  },
  "completedAt": "2024-01-01T12:05:00Z"
}
```

**Error Response (404):**
```json
{
  "error": "Results not found or still processing",
  "hint": "Wait for analysis to complete"
}
```

---

### Ask Question

Ask a question about document content.

**Endpoint:**
```
POST /analysis/question
```

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is the termination notice period?",
  "language": "English"
}
```

**Supported Languages:**
- English
- Spanish
- French
- German
- Chinese
- Japanese

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing_question"
}
```

**WebSocket Response:**
```json
{
  "type": "question_answered",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "According to section 5.2, either party may terminate with 30 days written notice..."
}
```

---

## Health Check Endpoint

### Health Status

Check backend availability.

**Endpoint:**
```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## WebSocket Events

Connect to `ws://localhost:5000` for real-time updates.

### Processing Update

**Event:**
```json
{
  "type": "processing_update",
  "stage": "extraction",
  "progress": 45,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

**Stages:**
- `upload` - File uploaded
- `extraction` - Text extraction
- `ai_analysis` - AI analysis
- `clause_detection` - Finding clauses
- `risk_assessment` - Scoring risk
- `next_steps` - Generating recommendations
- `analysis_complete` - Done
- `question_answered` - Q&A response ready
- `error` - Error occurred

**JavaScript Example:**
```javascript
const ws = new WebSocket('ws://localhost:5000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'processing_update') {
    console.log(`${message.stage}: ${message.progress}%`);
  }
};
```

---

## Error Handling

### Error Response Format

```json
{
  "error": "Error message description",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 202 | Accepted, processing |
| 400 | Bad request (validation error) |
| 404 | Not found |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

### Common Errors

**400 - No file uploaded**
```json
{
  "error": "No file uploaded"
}
```

**400 - Unsupported file type**
```json
{
  "error": "Unsupported file type. Allowed: PDF, DOC, DOCX"
}
```

**429 - Rate limit exceeded**
```json
{
  "error": "Too many uploads, please try again later."
}
```

**404 - Session not found**
```json
{
  "error": "Session not found"
}
```

---

## Code Examples

### Python

```python
import requests
import json

# Upload
files = {'document': open('contract.pdf', 'rb')}
resp = requests.post('http://localhost:5000/api/documents/upload', files=files)
session_id = resp.json()['sessionId']

# Wait for extraction
import time
while True:
    status = requests.get(f'http://localhost:5000/api/documents/session/{session_id}')
    if status.json()['status'] == 'extracted':
        break
    time.sleep(1)

# Analyze
requests.post('http://localhost:5000/api/analysis/analyze', 
              json={'sessionId': session_id})

# Get results
time.sleep(10)  # Wait for analysis
results = requests.get(f'http://localhost:5000/api/analysis/results/{session_id}')
print(json.dumps(results.json(), indent=2))
```

### JavaScript (Node.js)

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function analyzeDocument(filePath) {
  // Upload
  const formData = new FormData();
  formData.append('document', fs.createReadStream(filePath));
  
  const uploadResp = await axios.post(
    `${BASE_URL}/documents/upload`,
    formData,
    { headers: formData.getHeaders() }
  );
  
  const sessionId = uploadResp.data.sessionId;
  console.log(`Uploaded: ${sessionId}`);
  
  // Wait for extraction
  let extracted = false;
  while (!extracted) {
    const status = await axios.get(
      `${BASE_URL}/documents/session/${sessionId}`
    );
    extracted = status.data.status === 'extracted';
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Analyze
  await axios.post(`${BASE_URL}/analysis/analyze`, { sessionId });
  
  // Get results
  await new Promise(r => setTimeout(r, 10000));
  const results = await axios.get(
    `${BASE_URL}/analysis/results/${sessionId}`
  );
  
  return results.data;
}

analyzeDocument('./contract.pdf')
  .then(results => console.log(JSON.stringify(results, null, 2)))
  .catch(err => console.error(err));
```

---

## Best Practices

1. **Always check session status before requesting results**
2. **Use WebSocket for real-time progress updates**
3. **Implement retry logic for transient failures**
4. **Clean up old sessions regularly**
5. **Cache extracted text on client side**
6. **Use appropriate timeout values for file uploads**
7. **Validate file types before upload**
8. **Handle rate limiting gracefully**

---

## Changelog

**v1.0.0** (2024-01-01)
- Initial release
- Document upload, extraction, analysis
- Q&A capability
- WebSocket real-time updates
- Multilingual support

---

For support, check README.md or raise an issue on GitHub.
