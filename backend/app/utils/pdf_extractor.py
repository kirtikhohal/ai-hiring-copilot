import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    text_chunks = []
    with fitz.open(file_path) as doc:
        for page in doc:
            text_chunks.append(page.get_text())
    return "\n".join(text_chunks).strip()


def extract_text_from_pdf_bytes(content: bytes) -> str:
    """Same extraction as extract_text_from_pdf, but straight from bytes so an
    uploaded file needn't be written to disk first."""
    text_chunks = []
    with fitz.open(stream=content, filetype="pdf") as doc:
        for page in doc:
            text_chunks.append(page.get_text())
    return "\n".join(text_chunks).strip()