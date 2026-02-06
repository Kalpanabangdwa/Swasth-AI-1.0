# Swasth AI - Intelligent Health Assistant

Swasth AI is a comprehensive health management platform combining a modern, high-performance React frontend with a robust FastAPI backend. It features an AI-powered chatbot, symptom checker, diet planner, and health dashboard.

## 📂 Project Structure

```bash
swasth-ai/
├── backend/                 # Python FastAPI Backend
│   ├── main.py             # Entry point and API routes
│   ├── venv/               # Virtual Environment
│   └── requirements.txt    # Python dependencies
│
└── frontend/                # React + Vite Frontend
    ├── src/
    │   ├── components/     # Reusable UI components (Layout, Cards)
    │   ├── pages/          # Main Application Pages
    │   │   ├── Dashboard/  # Health Dashboard & Analytics
    │   │   ├── Chat/       # AI Chatbot Interface
    │   │   ├── Diet/       # Smart Diet Planner
    │   │   ├── Symptoms/   # Symptom Checker
    │   │   ├── Reports/    # Medical Report Scanner
    │   │   └── Profile/    # User Profile & Settings
    │   ├── context/        # React Context (User State)
    │   └── App.jsx         # Main Router Setup
    └── package.json        # Node dependencies
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+

### 1. Backend Setup
Navigate to the backend directory and activate the virtual environment:
```bash
cd backend
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate

# Install dependencies (if needed)
pip install fastapi uvicorn
```

Run the server:
```bash
python -m uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup
Navigate to the frontend directory and install dependencies:
```bash
cd frontend
npm install

# Install UI Enhancements (Optional but recommended)
npm install lucide-react framer-motion recharts
```

Run the development server:
```bash
npm run dev
```

## ✨ Key Features
- **AI Chatbot**: Intelligent disease awareness and care guides.
- **Symptom Checker**: Interactive body-map based symptom analysis.
- **Diet Planner**: Custom meal plans based on goals (Loss/Gain) and preferences.
- **Report Scanner**: Analyze medical reports (mock integration).
- **Dashboard**: Real-time health overview with animations.

## 🛠️ Tech Stack
- **Frontend**: React, Vite, CSS Modules (Glassmorphism design)
- **Backend**: FastAPI, Python
- **Design**: Custom CSS variables for Dark Mode & Premium Aesthetics
