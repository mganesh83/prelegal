from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, PlainTextResponse, Response, StreamingResponse
from pydantic import BaseModel

from renderer import render_html, render_docx, render_markdown

app = FastAPI(title="Pre Legal Document Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Party(BaseModel):
    name: str
    title: str
    company: str
    notice_address: str
    date: str


class MndaFormData(BaseModel):
    purpose: str
    effective_date: str
    mnda_term_type: str
    mnda_term_years: int | None = None
    confidentiality_term_type: str
    confidentiality_years: int | None = None
    governing_law: str
    jurisdiction: str
    party1: Party
    party2: Party


@app.get("/")
def root():
    return {"message": "Pre Legal Document Generator API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/mnda/preview")
def preview(data: MndaFormData):
    html = render_html(data.model_dump())
    return HTMLResponse(content=html)


@app.post("/api/mnda/download/pdf")
def download_pdf(data: MndaFormData):
    html = render_html(data.model_dump())
    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html).write_pdf()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="Mutual-NDA.pdf"'},
    )


@app.post("/api/mnda/download/docx")
def download_docx(data: MndaFormData):
    docx_bytes = render_docx(data.model_dump())
    return StreamingResponse(
        iter([docx_bytes]),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": 'attachment; filename="Mutual-NDA.docx"'},
    )


@app.post("/api/mnda/download/md")
def download_md(data: MndaFormData):
    md = render_markdown(data.model_dump())
    return PlainTextResponse(
        content=md,
        headers={"Content-Disposition": 'attachment; filename="Mutual-NDA.md"'},
    )
