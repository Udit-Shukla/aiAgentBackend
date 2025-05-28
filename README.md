# AI-Powered Price Intelligence Platform

A sophisticated backend service that leverages **Anthropic Claude AI** to analyze stock/inventory pricing data, generate business insights, and provide interactive Q&A capabilities for pricing intelligence.

## 🚀 Features

- **Excel File Comparison**: Upload and compare old vs new stock data files
- **AI-Powered Insights**: Generate comprehensive business intelligence using Claude AI
- **Interactive Chat**: Ask natural language questions about your pricing data
- **Smart SKU Matching**: Robust product identification and comparison logic
- **Cost Change Analysis**: Detailed percentage and absolute change calculations
- **Production Ready**: Docker containerization with CI/CD pipeline

## 🛠️ Technology Stack

- **Backend**: Node.js with Express.js
- **AI Integration**: Anthropic Claude 3.5 Sonnet
- **File Processing**: Multer for uploads, XLSX for Excel parsing
- **Deployment**: Docker + PM2 + Nginx
- **Infrastructure**: DigitalOcean with automated SSL

## 📋 Prerequisites

- Node.js 20 or higher
- Anthropic API key
- Docker (for deployment)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Udit-Shukla/aiAgentBackend.git
   cd aiAgentBackend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   PORT=8000
   NODE_ENV=development
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key | Yes |
| `PORT` | Server port (default: 8000) | No |
| `NODE_ENV` | Environment mode | No |

## 📡 API Endpoints

### 1. Compare Stocks
**POST** `/api/compare-stocks`

Upload two Excel files to compare stock data changes.

**Request**: Multipart form data
- `oldFile`: Previous stock data (Excel file)
- `newFile`: Current stock data (Excel file)

**Response**:
```json
{
  "summary": {
    "oldCount": 1500,
    "newCount": 1520,
    "added": 25,
    "removed": 5,
    "changed": 120
  },
  "added": [...],
  "removed": [...],
  "changed": [...]
}
```

### 2. Generate Insights
**POST** `/api/generate-insights`

Generate AI-powered business insights from comparison data.

**Request**:
```json
{
  "summary": { ... },
  "changed": [...],
  "added": [...],
  "removed": [...]
}
```

**Response**:
```json
{
  "insight": "<h2>Cost Analysis Summary</h2><ul><li>...</li></ul>"
}
```

### 3. Interactive Chat
**POST** `/api/chat`

Ask questions about your pricing data and insights.

**Request**:
```json
{
  "question": "Which SKUs had the highest cost increases?",
  "insight": "...",
  "dataSummary": { ... }
}
```

**Response**:
```json
{
  "answer": "Based on the data analysis..."
}
```

## 🏗️ Project Structure

```
├── server.js              # Main application entry point
├── routes/                 # API endpoint handlers
│   ├── compare.js         # File comparison logic
│   ├── generateInsights.js # AI insight generation
│   └── chats.js           # Interactive Q&A system
├── utils/                  # Helper functions
│   ├── compareStocks.js   # Core comparison algorithm
│   └── chunks.js          # Data chunking utilities
├── infra/                  # Infrastructure configuration
│   └── nginx.conf         # Nginx reverse proxy config
├── .github/workflows/      # CI/CD automation
│   └── deploy.yml         # Deployment pipeline
└── uploads/               # Temporary file storage
```

## 🐳 Docker Deployment

1. **Build the image**
   ```bash
   docker build -t aiagent-backend .
   ```

2. **Run the container**
   ```bash
   docker run -d --name aiagent-backend -p 8000:8000 --env-file .env aiagent-backend
   ```

## 🚀 Production Deployment

The project includes automated CI/CD via GitHub Actions that:

1. Deploys to DigitalOcean droplet
2. Sets up Nginx reverse proxy
3. Configures SSL with Let's Encrypt
4. Runs the application in Docker with PM2

**Domain**: `aiagents.worxstream.io`

## 🔍 Usage Examples

### Basic File Comparison
```javascript
const formData = new FormData();
formData.append('oldFile', oldExcelFile);
formData.append('newFile', newExcelFile);

const response = await fetch('/api/compare-stocks', {
  method: 'POST',
  body: formData
});

const comparisonData = await response.json();
```

### Generate Insights
```javascript
const insights = await fetch('/api/generate-insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(comparisonData)
});

const { insight } = await insights.json();
```

### Interactive Chat
```javascript
const chatResponse = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "What are the top 5 SKUs with price increases?",
    insight: insightHTML,
    dataSummary: comparisonData
  })
});

const { answer } = await chatResponse.json();
```

## 🎯 Business Value

This platform automates complex pricing analysis tasks and provides:

- **Automated Intelligence**: AI-driven insights from pricing data
- **Interactive Exploration**: Natural language queries about trends
- **Scalable Processing**: Handles large datasets through intelligent chunking
- **Professional Deployment**: Production-grade infrastructure
- **Time Savings**: Eliminates manual comparison and analysis work

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API examples

---

**Powered by Anthropic Claude AI** 🤖
