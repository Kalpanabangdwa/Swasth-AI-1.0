# 🌿 Swasth AI — Intelligent Health Assistant

Swasth AI is a comprehensive AI-powered health management platform featuring:

- 🤖 **AI Chatbot** — Real health assistance powered by Groq (LLaMA3)
- 🩺 **Symptom Checker** — Identifies top 3 possible conditions with self-care steps
- 🥗 **Smart Diet Planner** — 7-day personalised meal plans based on your profile, allergies & medical report deficiencies
- 🔬 **Lab Report Scanner** — Upload PDF medical reports for AI analysis
- 📊 **Health Dashboard** — Track calories, water, sleep and mood
- 👤 **User Profiles** — Persistent profiles stored in cloud database (Supabase)

---

## 🏗️ Tech Stack

| Layer           | Technology             |
| --------------- | ---------------------- |
| Frontend        | React + Vite           |
| Backend         | FastAPI (Python)       |
| Database        | PostgreSQL (Supabase)  |
| AI              | Groq API (LLaMA3-8b)   |
| Report Analysis | HuggingFace Mistral-7B |

---

## 📂 Project Structure

```
Updated/
├── backend/          # FastAPI Python backend
│   ├── main.py       # All API endpoints
│   ├── models.py     # Database models
│   ├── database.py   # DB connection
│   ├── services/     # Business logic
│   └── .env.example  # Environment variables template
│
└── frontend/         # React + Vite frontend
    ├── src/
    │   ├── pages/    # All page components
    │   ├── components/
    │   └── context/  # UserContext (global state)
    └── package.json
```

---

## 🚀 Quick Setup

See `SETUP_GUIDE.txt` for detailed setup instructions (shared privately).

### Requirements

- Python 3.11+
- Node.js 16+
- Groq API key (free at console.groq.com)
- Supabase account (free at supabase.com) OR use SQLite for local dev

---

## ✨ Features

### AI Chat Assistant

Real-time health guidance using Groq LLaMA3. Remembers conversation history and personalises responses based on your health profile.

### Smart Diet Planner

Generates a full 7-day meal plan that:

- Calculates your personal calorie target (BMR × activity level)
- Filters out your allergens automatically
- Adds foods that address deficiencies found in your medical reports
- Adjusts for medical conditions

### Symptom Checker

Select symptoms by body area → get top 3 possible conditions with:

- Confidence score
- Self-care steps
- When to see a doctor
- Emergency flags

### Lab Report Scanner

Upload any PDF medical report → AI extracts and analyses health markers, identifies deficiencies, and gives plain-language explanations.

---

## 🔒 Security Notes

- Never commit your `.env` file
- Use `.env.example` as a template
- Rotate API keys regularly
- All user data stored securely in Supabase PostgreSQL
