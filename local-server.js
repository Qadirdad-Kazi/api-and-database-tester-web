// Local Development Server (Optional - for testing locally)
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// API Proxy endpoint
app.post('/api/proxy', async (req, res) => {
    const { url, method, headers, body } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const startTime = Date.now();

        const fetchOptions = {
            method: method || 'GET',
            headers: headers || {}
        };

        if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
            fetchOptions.body = body;
        }

        const response = await fetch(url, fetchOptions);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

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
});

// MongoDB test endpoint
app.post('/api/mongodb-test', async (req, res) => {
    const { connectionString, tests } = req.body;

    if (!connectionString) {
        return res.status(400).json({ error: 'Connection string is required' });
    }

    if (!tests || tests.length === 0) {
        return res.status(400).json({ error: 'At least one test must be selected' });
    }

    let client;
    const results = [];

    try {
        client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        await client.connect();
        
        const db = client.db();
        const dbName = db.databaseName;

        for (const test of tests) {
            try {
                switch (test) {
                    case 'connection':
                        await client.db('admin').command({ ping: 1 });
                        results.push({
                            test: 'Connection Test',
                            success: true,
                            data: {
                                status: 'Connected successfully',
                                database: dbName
                            }
                        });
                        break;

                    case 'list-databases':
                        const adminDb = client.db('admin');
                        const databases = await adminDb.admin().listDatabases();
                        results.push({
                            test: 'List Databases',
                            success: true,
                            data: {
                                count: databases.databases.length,
                                databases: databases.databases.map(db => ({
                                    name: db.name,
                                    sizeOnDisk: `${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`,
                                    empty: db.empty
                                }))
                            }
                        });
                        break;

                    case 'list-collections':
                        const collections = await db.listCollections().toArray();
                        results.push({
                            test: 'List Collections',
                            success: true,
                            data: {
                                database: dbName,
                                count: collections.length,
                                collections: collections.map(c => c.name)
                            }
                        });
                        break;

                    case 'count-documents':
                        const collections2 = await db.listCollections().toArray();
                        const counts = {};
                        for (const col of collections2) {
                            const count = await db.collection(col.name).countDocuments();
                            counts[col.name] = count;
                        }
                        results.push({
                            test: 'Count Documents',
                            success: true,
                            data: {
                                database: dbName,
                                documentCounts: counts,
                                totalDocuments: Object.values(counts).reduce((a, b) => a + b, 0)
                            }
                        });
                        break;

                    case 'sample-documents':
                        const collections3 = await db.listCollections().toArray();
                        const samples = {};
                        for (const col of collections3) {
                            const docs = await db.collection(col.name).find().limit(5).toArray();
                            samples[col.name] = docs;
                        }
                        results.push({
                            test: 'Sample Documents',
                            success: true,
                            data: {
                                database: dbName,
                                samples: samples
                            }
                        });
                        break;

                    case 'indexes':
                        const collections4 = await db.listCollections().toArray();
                        const indexes = {};
                        for (const col of collections4) {
                            const idxs = await db.collection(col.name).indexes();
                            indexes[col.name] = idxs;
                        }
                        results.push({
                            test: 'List Indexes',
                            success: true,
                            data: {
                                database: dbName,
                                indexes: indexes
                            }
                        });
                        break;

                    case 'server-status':
                        const serverStatus = await client.db('admin').command({ serverStatus: 1 });
                        results.push({
                            test: 'Server Status',
                            success: true,
                            data: {
                                version: serverStatus.version,
                                uptime: `${Math.floor(serverStatus.uptime / 3600)} hours`,
                                connections: serverStatus.connections,
                                network: {
                                    bytesIn: `${(serverStatus.network.bytesIn / 1024 / 1024).toFixed(2)} MB`,
                                    bytesOut: `${(serverStatus.network.bytesOut / 1024 / 1024).toFixed(2)} MB`,
                                    numRequests: serverStatus.network.numRequests
                                },
                                memory: {
                                    resident: `${serverStatus.mem.resident} MB`,
                                    virtual: `${serverStatus.mem.virtual} MB`
                                }
                            }
                        });
                        break;

                    case 'db-stats':
                        const stats = await db.stats();
                        results.push({
                            test: 'Database Stats',
                            success: true,
                            data: {
                                database: dbName,
                                collections: stats.collections,
                                views: stats.views,
                                objects: stats.objects,
                                avgObjSize: `${(stats.avgObjSize / 1024).toFixed(2)} KB`,
                                dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
                                storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
                                indexes: stats.indexes,
                                indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
                            }
                        });
                        break;

                    default:
                        results.push({
                            test: test,
                            success: false,
                            error: 'Unknown test type'
                        });
                }
            } catch (testError) {
                results.push({
                    test: test,
                    success: false,
                    error: testError.message
                });
            }
        }

        res.json({ results });

    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        res.status(500).json({ 
            error: error.message,
            details: 'Failed to connect to MongoDB. Please check your connection string.'
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 ============================================`);
    console.log(`✅ Unified Testing Suite Server Running!`);
    console.log(`============================================`);
    console.log(`📍 Local:    http://localhost:${PORT}`);
    console.log(`📂 Frontend: Open http://localhost:${PORT}/index.html`);
    console.log(`🔌 API Endpoints:`);
    console.log(`   - POST /api/proxy (API Tester)`);
    console.log(`   - POST /api/mongodb-test (MongoDB Tester)`);
    console.log(`============================================\n`);
});

