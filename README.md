# prelegal

A platform for drafting common legal agreements.

## Project Structure

```
├── backend/          # FastAPI API server
│   ├── main.py       # API endpoints
│   ├── renderer.py   # Document rendering (HTML, PDF, DOCX, MD)
│   └── requirements.txt
├── frontend/         # Next.js web application
│   └── src/app/      # App router pages
└── templates/        # Legal document templates (from CommonPaper)
```

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Features

- **Mutual NDA Generator** — Fill in a form, preview the document, and download as PDF, DOCX, or Markdown
- **Template Library** — 11 legal document templates from [CommonPaper](https://github.com/CommonPaper)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/mnda/preview` | Render NDA as HTML preview |
| POST | `/api/mnda/download/pdf` | Download NDA as PDF |
| POST | `/api/mnda/download/docx` | Download NDA as DOCX |
| POST | `/api/mnda/download/md` | Download NDA as Markdown |
