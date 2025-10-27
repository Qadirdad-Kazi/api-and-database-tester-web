// API Configuration - will work with both local and deployed environments
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : '';  // For Vercel deployment, use relative path

// Load saved APIs from localStorage
let savedApis = JSON.parse(localStorage.getItem('savedApis') || '[]');

// ============ UTILITY FUNCTIONS ============
function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString();
}

function addOutput(outputId, message, type = 'info') {
    const output = document.getElementById(outputId);
    const line = document.createElement('div');
    line.className = `output-line ${type}`;
    line.innerHTML = `
        <span class="timestamp">[${getTimestamp()}]</span>
        <span>${message}</span>
    `;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
}

function switchMainTab(tabName) {
    // Update main tab buttons
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update main tab content
    document.querySelectorAll('.main-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`main-tab-${tabName}`).classList.add('active');
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

// ============ API TESTER FUNCTIONS ============
function clearApiOutput() {
    const output = document.getElementById('apiOutput');
    output.innerHTML = '';
    addOutput('apiOutput', 'Output cleared.', 'info');
    updateApiStatus('idle');
}

function updateApiStatus(status) {
    const badge = document.getElementById('apiStatusBadge');
    badge.className = `status-badge ${status}`;
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

function addHeaderRow() {
    const headersList = document.getElementById('headersList');
    const row = document.createElement('div');
    row.className = 'header-row';
    row.innerHTML = `
        <input type="text" placeholder="Header Key" class="header-key">
        <input type="text" placeholder="Header Value" class="header-value">
        <button class="btn-remove-header" onclick="removeHeaderRow(this)">Remove</button>
    `;
    headersList.appendChild(row);
}

function removeHeaderRow(button) {
    button.parentElement.remove();
}

function toggleAuthFields() {
    const authType = document.getElementById('authType').value;
    const authFields = document.getElementById('authFields');
    
    if (authType === 'none') {
        authFields.innerHTML = '';
    } else if (authType === 'bearer') {
        authFields.innerHTML = `
            <div class="input-group">
                <label for="bearerToken">Bearer Token:</label>
                <input type="text" id="bearerToken" placeholder="your-token-here">
            </div>
        `;
    } else if (authType === 'basic') {
        authFields.innerHTML = `
            <div class="input-group">
                <label for="username">Username:</label>
                <input type="text" id="username" placeholder="username">
            </div>
            <div class="input-group">
                <label for="password">Password:</label>
                <input type="text" id="password" placeholder="password">
            </div>
        `;
    } else if (authType === 'apikey') {
        authFields.innerHTML = `
            <div class="input-group">
                <label for="apiKeyHeader">Header Name:</label>
                <input type="text" id="apiKeyHeader" placeholder="X-API-Key" value="X-API-Key">
            </div>
            <div class="input-group">
                <label for="apiKeyValue">API Key:</label>
                <input type="text" id="apiKeyValue" placeholder="your-api-key">
            </div>
        `;
    }
}

function getHeaders() {
    const headers = {};
    const headerRows = document.querySelectorAll('#headersList .header-row');
    
    headerRows.forEach(row => {
        const key = row.querySelector('.header-key').value.trim();
        const value = row.querySelector('.header-value').value.trim();
        if (key && value) {
            headers[key] = value;
        }
    });

    // Add auth headers
    const authType = document.getElementById('authType').value;
    if (authType === 'bearer') {
        const token = document.getElementById('bearerToken')?.value;
        if (token) headers['Authorization'] = `Bearer ${token}`;
    } else if (authType === 'basic') {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        if (username && password) {
            headers['Authorization'] = `Basic ${btoa(username + ':' + password)}`;
        }
    } else if (authType === 'apikey') {
        const headerName = document.getElementById('apiKeyHeader')?.value || 'X-API-Key';
        const apiKey = document.getElementById('apiKeyValue')?.value;
        if (apiKey) headers[headerName] = apiKey;
    }

    return headers;
}

async function runApiTest() {
    const url = document.getElementById('apiUrl').value.trim();
    const method = document.getElementById('method').value;
    const requestBody = document.getElementById('requestBody').value.trim();
    const expectedStatus = parseInt(document.getElementById('expectedStatus').value) || 200;

    if (!url) {
        addOutput('apiOutput', '❌ Error: Please enter an API URL', 'error');
        return;
    }

    clearApiOutput();
    addOutput('apiOutput', '🚀 Starting API test...', 'info');
    addOutput('apiOutput', `📋 Method: ${method}`, 'info');
    addOutput('apiOutput', `🔗 URL: ${url}`, 'info');
    addOutput('apiOutput', '─'.repeat(80), 'info');
    updateApiStatus('testing');

    try {
        const headers = getHeaders();
        
        // Add Content-Type for POST/PUT/PATCH
        if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
            headers['Content-Type'] = 'application/json';
        }

        // Validate JSON if body is provided
        if (['POST', 'PUT', 'PATCH'].includes(method) && requestBody) {
            try {
                JSON.parse(requestBody);
            } catch (e) {
                addOutput('apiOutput', '❌ Error: Invalid JSON in request body', 'error');
                updateApiStatus('error');
                return;
            }
        }

        addOutput('apiOutput', '📤 Sending request through proxy...', 'info');

        // Use proxy API endpoint
        const proxyUrl = `${API_BASE_URL}/api/proxy`;
        const proxyResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                method: method,
                headers: headers,
                body: requestBody
            })
        });

        if (!proxyResponse.ok) {
            const errorData = await proxyResponse.json();
            throw new Error(errorData.error || 'Proxy request failed');
        }

        const data = await proxyResponse.json();
        const response = {
            status: data.status,
            statusText: data.statusText,
            ok: data.ok,
            headers: new Map(Object.entries(data.headers))
        };
        const responseTime = data.responseTime;
        const responseData = data.body;

        addOutput('apiOutput', '─'.repeat(80), 'info');

        // Test: Status Code
        if (document.getElementById('test-status-code').checked) {
            if (response.status === expectedStatus) {
                addOutput('apiOutput', `✅ Status Code: ${response.status} (Expected: ${expectedStatus})`, 'success');
            } else {
                addOutput('apiOutput', `⚠️ Status Code: ${response.status} (Expected: ${expectedStatus})`, 'warning');
            }
        }

        // Test: Response Time
        if (document.getElementById('test-response-time').checked) {
            addOutput('apiOutput', `⏱️ Response Time: ${responseTime}ms`, responseTime < 1000 ? 'success' : 'warning');
        }

        // Test: Response Headers
        if (document.getElementById('test-headers').checked) {
            addOutput('apiOutput', '📋 Response Headers:', 'info');
            const headersObj = {};
            response.headers.forEach((value, key) => {
                headersObj[key] = value;
            });
            addOutput('apiOutput', `<pre>${JSON.stringify(headersObj, null, 2)}</pre>`, 'info');
        }

        // Test: Content-Type
        if (document.getElementById('test-content-type').checked) {
            const contentType = response.headers.get('content-type');
            addOutput('apiOutput', `📄 Content-Type: ${contentType}`, 'info');
        }

        // Test: Response Body
        if (document.getElementById('test-body').checked) {
            addOutput('apiOutput', '📦 Response Body:', 'info');
            if (typeof responseData === 'object') {
                addOutput('apiOutput', `<pre>${JSON.stringify(responseData, null, 2)}</pre>`, 'info');
            } else {
                addOutput('apiOutput', `<pre>${responseData}</pre>`, 'info');
            }
        }

        // Test: JSON Schema
        if (document.getElementById('test-json-schema').checked && typeof responseData === 'object') {
            addOutput('apiOutput', '🔍 JSON Structure:', 'info');
            const structure = getJsonStructure(responseData);
            addOutput('apiOutput', `<pre>${JSON.stringify(structure, null, 2)}</pre>`, 'info');
        }

        addOutput('apiOutput', '─'.repeat(80), 'info');
        addOutput('apiOutput', '✨ Test completed successfully!', 'success');
        updateApiStatus(response.ok ? 'success' : 'error');

    } catch (error) {
        addOutput('apiOutput', `❌ Error: ${error.message}`, 'error');
        addOutput('apiOutput', '💡 Make sure the backend API is accessible', 'warning');
        updateApiStatus('error');
    }
}

function getJsonStructure(obj, depth = 0) {
    if (depth > 3) return '...';
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) return [];
        return [getJsonStructure(obj[0], depth + 1)];
    } else if (obj !== null && typeof obj === 'object') {
        const structure = {};
        for (const key in obj) {
            structure[key] = typeof obj[key];
            if (typeof obj[key] === 'object') {
                structure[key] = getJsonStructure(obj[key], depth + 1);
            }
        }
        return structure;
    }
    return typeof obj;
}

function saveApi() {
    const name = document.getElementById('apiName').value.trim();
    const url = document.getElementById('apiUrl').value.trim();
    const method = document.getElementById('method').value;
    const requestBody = document.getElementById('requestBody').value.trim();
    const expectedStatus = document.getElementById('expectedStatus').value;

    if (!name) {
        addOutput('apiOutput', '❌ Error: Please enter an API name', 'error');
        return;
    }

    if (!url) {
        addOutput('apiOutput', '❌ Error: Please enter an API URL', 'error');
        return;
    }

    const api = {
        id: Date.now(),
        name,
        url,
        method,
        requestBody,
        expectedStatus,
        headers: getHeaders(),
        authType: document.getElementById('authType').value,
        tests: {
            statusCode: document.getElementById('test-status-code').checked,
            responseTime: document.getElementById('test-response-time').checked,
            headers: document.getElementById('test-headers').checked,
            body: document.getElementById('test-body').checked,
            contentType: document.getElementById('test-content-type').checked,
            jsonSchema: document.getElementById('test-json-schema').checked
        }
    };

    savedApis.push(api);
    localStorage.setItem('savedApis', JSON.stringify(savedApis));
    
    addOutput('apiOutput', `✅ API "${name}" saved successfully!`, 'success');
    renderSavedApis();
}

function loadApi(id) {
    const api = savedApis.find(a => a.id === id);
    if (!api) return;

    document.getElementById('apiName').value = api.name;
    document.getElementById('apiUrl').value = api.url;
    document.getElementById('method').value = api.method;
    document.getElementById('requestBody').value = api.requestBody || '';
    document.getElementById('expectedStatus').value = api.expectedStatus || '200';
    document.getElementById('authType').value = api.authType || 'none';

    // Set test checkboxes
    if (api.tests) {
        document.getElementById('test-status-code').checked = api.tests.statusCode;
        document.getElementById('test-response-time').checked = api.tests.responseTime;
        document.getElementById('test-headers').checked = api.tests.headers;
        document.getElementById('test-body').checked = api.tests.body;
        document.getElementById('test-content-type').checked = api.tests.contentType;
        document.getElementById('test-json-schema').checked = api.tests.jsonSchema;
    }

    addOutput('apiOutput', `✅ Loaded API: ${api.name}`, 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteApi(id) {
    savedApis = savedApis.filter(a => a.id !== id);
    localStorage.setItem('savedApis', JSON.stringify(savedApis));
    renderSavedApis();
    addOutput('apiOutput', '🗑️ API deleted', 'info');
}

function renderSavedApis() {
    const container = document.getElementById('savedApisList');
    
    if (savedApis.length === 0) {
        container.innerHTML = `
            <div class="output-line info">
                <span>No saved APIs yet. Click "Save API" to save your current configuration.</span>
            </div>
        `;
        return;
    }

    container.innerHTML = savedApis.map(api => `
        <div class="api-item">
            <div class="api-item-info">
                <span class="api-item-method method-${api.method}">${api.method}</span>
                <span class="api-item-url"><strong>${api.name}</strong> - ${api.url}</span>
            </div>
            <div class="api-item-actions">
                <button class="btn-primary btn-small" onclick="loadApi(${api.id})">Load</button>
                <button class="btn-primary btn-small" onclick="loadApi(${api.id}); runApiTest();">Run</button>
                <button class="btn-secondary btn-small" onclick="deleteApi(${api.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

// ============ MONGODB TESTER FUNCTIONS ============
function clearMongoOutput() {
    const output = document.getElementById('mongoOutput');
    output.innerHTML = '';
    addOutput('mongoOutput', 'Output cleared.', 'info');
    updateMongoStatus('disconnected');
}

function updateMongoStatus(status) {
    const badge = document.getElementById('mongoStatusBadge');
    badge.className = `status-badge ${status}`;
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
}

async function runMongoTests() {
    const connectionString = document.getElementById('connectionString').value.trim();
    
    if (!connectionString) {
        addOutput('mongoOutput', '❌ Error: Please enter a MongoDB connection string', 'error');
        return;
    }

    const selectedTests = [];
    const checkboxes = document.querySelectorAll('[id^="mongo-test-"]');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            selectedTests.push(cb.id.replace('mongo-test-', ''));
        }
    });

    if (selectedTests.length === 0) {
        addOutput('mongoOutput', '❌ Error: Please select at least one test to run', 'error');
        return;
    }

    clearMongoOutput();
    addOutput('mongoOutput', '🚀 Starting tests...', 'info');
    addOutput('mongoOutput', `📋 Selected tests: ${selectedTests.join(', ')}`, 'info');
    addOutput('mongoOutput', '─'.repeat(80), 'info');
    updateMongoStatus('testing');

    try {
        const apiUrl = `${API_BASE_URL}/api/mongodb-test`;
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                connectionString,
                tests: selectedTests
            })
        });

        const data = await response.json();

        if (!response.ok) {
            addOutput('mongoOutput', `❌ Error: ${data.error}`, 'error');
            if (data.details) {
                addOutput('mongoOutput', `💡 ${data.details}`, 'warning');
            }
            updateMongoStatus('disconnected');
            return;
        }

        // Display results
        if (data.results) {
            data.results.forEach(result => {
                if (result.success) {
                    addOutput('mongoOutput', `✅ ${result.test}`, 'success');
                    if (result.data) {
                        addOutput('mongoOutput', `<pre>${JSON.stringify(result.data, null, 2)}</pre>`, 'info');
                    }
                } else {
                    addOutput('mongoOutput', `❌ ${result.test}: ${result.error}`, 'error');
                }
                addOutput('mongoOutput', '─'.repeat(80), 'info');
            });
        }

        addOutput('mongoOutput', '✨ All tests completed!', 'success');
        updateMongoStatus('connected');

    } catch (error) {
        addOutput('mongoOutput', `❌ Network Error: ${error.message}`, 'error');
        addOutput('mongoOutput', '💡 Make sure the backend API is accessible', 'warning');
        updateMongoStatus('disconnected');
    }
}

// ============ INITIALIZATION ============
// Initialize saved APIs
renderSavedApis();

// Allow Enter key for API URL
document.getElementById('apiUrl').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        runApiTest();
    }
});

// Allow Enter key for MongoDB connection string
document.getElementById('connectionString').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        runMongoTests();
    }
});

