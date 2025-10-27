// Vercel Serverless Function for API Proxy
export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url, method, headers, body } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const startTime = Date.now();

        // Prepare fetch options
        const fetchOptions = {
            method: method || 'GET',
            headers: headers || {}
        };

        // Add body for POST/PUT/PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
            fetchOptions.body = body;
        }

        // Make the request
        const response = await fetch(url, fetchOptions);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Get response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        // Get response body
        const contentType = response.headers.get('content-type');
        let responseData;

        if (contentType && contentType.includes('application/json')) {
            try {
                responseData = await response.json();
            } catch (e) {
                responseData = await response.text();
            }
        } else {
            responseData = await response.text();
        }

        // Send back the complete response
        res.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseData,
            responseTime: responseTime,
            ok: response.ok
        });

    } catch (error) {
        console.error('Proxy Error:', error);
        res.status(500).json({
            error: error.message,
            details: 'Failed to fetch the URL. Please check if the URL is accessible.'
        });
    }
}

