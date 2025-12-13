#!/usr/bin/env node

/**
 * Aurora.ai - Test Document Upload Script
 * This script tests the backend API by uploading a sample document
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_BASE = 'http://localhost:5000/api';

// Create a simple test document
async function createTestDocument() {
  const testContent = `
SAMPLE SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of December 13, 2025, 
between Customer ("Client") and Aurora.ai ("Service Provider").

1. SERVICES
The Service Provider agrees to provide AI-powered legal document analysis services 
as described in Schedule A attached hereto.

2. PAYMENT TERMS
Client shall pay Service Provider a monthly fee of $999 USD, due within 30 days 
of invoice date. Payment should be made via bank transfer to the account specified 
in the invoice.

3. TERM AND TERMINATION
This Agreement shall commence on the date first written above and shall continue 
for an initial term of twelve (12) months, unless earlier terminated by either 
party upon thirty (30) days' written notice.

4. CONFIDENTIALITY
Both parties agree to maintain the confidentiality of any proprietary information 
shared during the term of this Agreement and for a period of two (2) years 
following termination.

5. LIABILITY
In no event shall either party be liable for indirect, incidental, special, 
consequential, or punitive damages arising out of this Agreement, regardless of 
the cause of action or theory of liability.

6. GOVERNING LAW
This Agreement shall be governed by and construed in accordance with the laws 
of the United States, without regard to its conflict of law principles.

7. ENTIRE AGREEMENT
This Agreement constitutes the entire agreement between the parties and supersedes 
all prior negotiations, representations, and agreements.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date 
first written above.

Aurora.ai: _________________________
Service Provider

Client: _________________________
Authorized Representative
`;

  const testFile = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFile, testContent);
  return testFile;
}

// Test upload endpoint
async function testUpload() {
  try {
    console.log('🧪 Testing Aurora.ai Backend API\n');
    
    console.log('1️⃣  Creating test document...');
    const testFile = await createTestDocument();
    console.log(`   ✅ Created: ${testFile}`);
    
    console.log('\n2️⃣  Uploading to backend...');
    const form = new FormData();
    form.append('document', fs.createReadStream(testFile));
    
    const uploadResponse = await axios.post(`${API_BASE}/documents/upload`, form, {
      headers: form.getHeaders()
    });
    
    const { sessionId } = uploadResponse.data;
    console.log(`   ✅ Upload successful`);
    console.log(`   📋 Session ID: ${sessionId}`);
    
    console.log('\n3️⃣  Waiting for text extraction (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n4️⃣  Checking extraction status...');
    const statusResponse = await axios.get(`${API_BASE}/documents/session/${sessionId}`);
    console.log(`   ✅ Status: ${statusResponse.data.status}`);
    
    console.log('\n5️⃣  Retrieving extracted text...');
    const textResponse = await axios.get(`${API_BASE}/documents/session/${sessionId}/text`);
    const { text, wordCount, pageCount } = textResponse.data;
    console.log(`   ✅ Extracted ${wordCount} words`);
    console.log(`   ✅ Pages: ${pageCount}`);
    
    console.log('\n6️⃣  Starting AI analysis...');
    const analysisResponse = await axios.post(`${API_BASE}/analysis/analyze`, {
      sessionId
    });
    console.log(`   ✅ Analysis triggered`);
    
    console.log('\n7️⃣  Waiting for analysis (5 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n8️⃣  Retrieving analysis results...');
    const resultsResponse = await axios.get(`${API_BASE}/analysis/results/${sessionId}`);
    const { summary, documentType, clauses, riskAssessment } = resultsResponse.data;
    
    console.log(`   ✅ Document Type: ${documentType}`);
    console.log(`   ✅ Risk Level: ${riskAssessment?.score}`);
    console.log(`   ✅ Clauses Found: ${clauses?.length || 0}`);
    console.log(`   ✅ Summary: ${summary?.substring(0, 100)}...`);
    
    console.log('\n9️⃣  Testing Q&A...');
    const qaResponse = await axios.post(`${API_API}/analysis/question`, {
      sessionId,
      question: 'What is the payment term mentioned in this document?',
      language: 'English'
    });
    console.log(`   ✅ Q&A Response: ${qaResponse.data.answer?.substring(0, 100)}...`);
    
    console.log('\n✅ All tests passed! Backend is working correctly.\n');
    
    // Cleanup
    fs.unlinkSync(testFile);
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error: ${JSON.stringify(error.response.data)}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Backend is not running. Start it with: npm run dev');
    } else {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run tests
testUpload();
