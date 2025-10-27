# 🚀 Unified Testing Suite

A comprehensive, modern testing platform combining **API Testing** and **MongoDB Testing** capabilities in one beautiful interface. Designed for deployment with **Frontend on Netlify** and **Backend on Vercel**.

## ✨ Features

### 🔌 API Tester
- ✅ Support for all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Custom headers configuration
- ✅ Request body editor (JSON)
- ✅ Multiple authentication types (Bearer Token, Basic Auth, API Key)
- ✅ Real-time testing with comprehensive validations
- ✅ Save and load API configurations
- ✅ Built-in CORS bypass proxy
- ✅ Beautiful color-coded UI

### 🍃 MongoDB Tester
- ✅ Test MongoDB connections (local & cloud)
- ✅ List all databases
- ✅ List collections
- ✅ Count documents in collections
- ✅ Sample documents retrieval
- ✅ View indexes
- ✅ Server status information
- ✅ Database statistics
- ✅ Works with MongoDB Atlas

## 📁 Project Structure

```
unified-tester/
├── index.html              # Unified frontend interface
├── app.js                  # Frontend JavaScript logic
├── api/                    # Vercel serverless functions
│   ├── proxy.js           # API proxy endpoint
│   └── mongodb-test.js    # MongoDB testing endpoint
├── package.json           # Dependencies
├── vercel.json            # Vercel configuration
├── netlify.toml           # Netlify configuration
├── local-server.js        # Local development server
└── README.md              # This file
```

## 🚀 Deployment Guide

### Option 1: Deploy Backend to Vercel (Recommended)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com) and sign up

2. **Install Vercel CLI** (Optional)
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel**
   
   **Method A: Using Vercel CLI**
   ```bash
   cd unified-tester
   vercel
   ```
   
   **Method B: Using Git (Recommended)**
   - Push your code to GitHub
   - Import your repository in Vercel dashboard
   - Vercel will auto-detect settings
   - Click "Deploy"

4. **Copy Your Vercel URL**
   - After deployment, you'll get a URL like: `https://your-app.vercel.app`

### Option 2: Deploy Frontend to Netlify

1. **Create Netlify Account**
   - Go to [netlify.com](https://netlify.com) and sign up

2. **Update `netlify.toml`**
   - Replace `your-vercel-backend.vercel.app` with your actual Vercel URL:
   ```toml
   [[redirects]]
     from = "/api/*"
     to = "https://YOUR-ACTUAL-VERCEL-URL.vercel.app/api/:splat"
     status = 200
     force = true
   ```

3. **Deploy to Netlify**
   
   **Method A: Drag & Drop**
   - Zip the `unified-tester` folder
   - Go to Netlify dashboard
   - Drag and drop the folder
   
   **Method B: Using Git (Recommended)**
   - Push your code to GitHub
   - Connect repository in Netlify
   - Set publish directory: `.` (root)
   - Click "Deploy"

4. **Your Site is Live!**
   - You'll get a URL like: `https://your-app.netlify.app`

### Alternative: Deploy Both to Vercel

If you want to keep everything on Vercel:

1. Deploy the backend as shown above
2. Update `app.js` to use your Vercel backend URL:
   ```javascript
   const API_BASE_URL = 'https://your-vercel-app.vercel.app';
   ```
3. Vercel will automatically serve the frontend files

## 💻 Local Development

1. **Install Dependencies**
   ```bash
   cd unified-tester
   npm install
   ```

2. **Start Local Server**
   ```bash
   npm start
   ```

3. **Open in Browser**
   - Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables (Optional)

For Vercel, you can set environment variables in the dashboard:
- `MONGODB_TIMEOUT`: Connection timeout in ms (default: 5000)
- Add any other custom configuration

### CORS Configuration

Both API endpoints have CORS enabled by default. If you need to restrict access:

1. Edit `api/proxy.js` and `api/mongodb-test.js`
2. Change:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   ```
   To:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', 'https://your-frontend.netlify.app');
   ```

## 📖 Usage Guide

### API Tester

1. **Select HTTP Method** (GET, POST, PUT, PATCH, DELETE)
2. **Enter API URL**
3. **Configure Headers** (optional)
   - Click "+ Add Header" to add custom headers
4. **Add Request Body** (for POST/PUT/PATCH)
   - Switch to "Body" tab
   - Enter JSON data
5. **Set Authorization** (optional)
   - Switch to "Authorization" tab
   - Choose auth type and enter credentials
6. **Select Test Options**
   - Choose which validations to run
7. **Click "Send Request"**
8. **View Results** in the output section
9. **Save API** for future use

### MongoDB Tester

1. **Enter MongoDB Connection String**
   - Local: `mongodb://localhost:27017/mydb`
   - Atlas: `mongodb+srv://user:pass@cluster.mongodb.net/mydb`
2. **Select Tests to Run**
   - Choose from 8 different test types
3. **Click "Run Tests"**
4. **View Results** in the output section

### Examples

#### Test a Public API
```
Method: GET
URL: https://jsonplaceholder.typicode.com/posts/1
```

#### Test with Bearer Token
```
Method: GET
URL: https://api.example.com/protected
Authorization: Bearer Token
Token: your-token-here
```

#### MongoDB Atlas Connection
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/myDatabase
```

## 🛠️ Technologies Used

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks needed)
- **Backend**: Node.js with Vercel Serverless Functions
- **Database**: MongoDB with official Node.js driver
- **Deployment**: 
  - Netlify (Frontend hosting)
  - Vercel (Serverless API functions)

## 🔒 Security Considerations

1. **Never commit sensitive data** (connection strings, API keys)
2. **Use environment variables** for sensitive configuration
3. **MongoDB Atlas**: Enable IP whitelist and use strong passwords
4. **API Testing**: Be careful when testing production APIs
5. **CORS**: Configure appropriately for production

## 🐛 Troubleshooting

### "Network Error" when testing APIs
- Make sure your backend is deployed and running
- Check the API_BASE_URL in `app.js`
- Verify CORS settings

### MongoDB connection fails
- Check connection string format
- For Atlas: Whitelist your IP address
- Verify network access in MongoDB Atlas
- Check username/password encoding

### Deployment issues
- Ensure `vercel.json` is properly configured
- Check Node.js version compatibility (use latest LTS)
- Verify all dependencies are in `package.json`

## 📝 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📧 Support

If you have questions or need help:
1. Check the troubleshooting section
2. Review the deployment logs in Vercel/Netlify
3. Check browser console for errors

---

**Built with ❤️ for comprehensive API and MongoDB testing**

## 🎯 Quick Start Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Test locally (`npm start`)
- [ ] Create Vercel account
- [ ] Deploy backend to Vercel
- [ ] Copy Vercel URL
- [ ] Update `netlify.toml` with Vercel URL
- [ ] Create Netlify account
- [ ] Deploy frontend to Netlify
- [ ] Test your deployed application
- [ ] Share your testing suite! 🎉

