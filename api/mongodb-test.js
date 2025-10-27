// Vercel Serverless Function for MongoDB Testing
import { MongoClient } from 'mongodb';

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
        // Connect to MongoDB
        client = new MongoClient(connectionString, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000
        });
        await client.connect();
        
        const db = client.db();
        const dbName = db.databaseName;

        // Run selected tests
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
}

