"""
run ollama pull qwen2.5:3b after downloading ollama first

Usage:
  python quizgen.py notes.pdf
  python quizgen.py notes.pdf --type mcq/tf/fill
  
  (for testing)
  python quizgen.py notes.pdf --questions-per-chunk 2  # fewer questions
  python quizgen.py notes.pdf --max-chars 1500         # smaller chunks (faster)
"""

import re
import csv
import sys
try:
    sys.stdout.reconfigure(encoding="utf-8")
except:
    pass
import json
import argparse
from pathlib import Path

import requests
import pdfplumber
import pandas as pd
from tqdm import tqdm
from docx import Document

OLLAMA_URL  = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:3b"

################################################################################################################
# Ollama helpers
def check_ollama():
    """Verify Ollama is running and the model is available. Exit with a clear
    message if either check fails."""
    try:
        resp = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        resp.raise_for_status()
    except requests.ConnectionError:
        sys.exit(
            "\n[ERROR] Ollama is not running.\n"
            "Start it in a separate terminal with:\n\n"
            "    ollama serve\n\n"
            "Then re-run this script."
        )
    except requests.HTTPError as exc:
        sys.exit(f"\n[ERROR] Ollama responded with an error: {exc}")

    available = [m["name"] for m in resp.json().get("models", [])]
    if not any(OLLAMA_MODEL.split(":")[0] in m for m in available):
        sys.exit(
            f"\n[ERROR] Model '{OLLAMA_MODEL}' not found in Ollama.\n"
            f"Pull it with:\n\n"
            f"    ollama pull {OLLAMA_MODEL}\n\n"
            f"Available models: {available or 'none'}"
        )
    print(f"Ollama is running. Model '{OLLAMA_MODEL}' is available.")

def run_inference(messages: list[dict], max_tokens: int = 2048):
    # sends messages pass from chunked text to model with prompt
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
        "think": False,
        "options": {
            "num_predict": max_tokens,
            "temperature": 0.4,
            "top_p": 0.8,
            "top_k": 20,
        }
    }
    # response output from model
    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json=payload,
        timeout=600,
    )
    response.raise_for_status()
    return response.json()["message"]["content"].strip()

################################################################################################################
# Text extraction
def extract_pdf(path: str):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_docx(path: str):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def extract_txt(path: str):
    return Path(path).read_text(encoding="utf-8", errors="ignore")

def extract_text(path: str):
    ext = Path(path).suffix.lower().lstrip(".")
    extractors = {"pdf": extract_pdf, "docx": extract_docx, "txt": extract_txt}
    if ext not in extractors:
        raise ValueError(f"Unsupported file type: .{ext}")
    return extractors[ext](path)

# Text chunking
def chunk_text(text: str, max_chars: int):
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r"(?<=[.!?])\s+", text)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
            current = sentence
        else:
            current = (current + " " + sentence).strip()
    if current:
        chunks.append(current.strip())
    return chunks

# Extract JSON from model output
def _parse_json_array(raw: str):
    # strip markdown fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw).strip()

    # strip any preamble text before the first [
    bracket_start = raw.find("[")
    if bracket_start > 0:
        raw = raw[bracket_start:]

    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else None
    except json.JSONDecodeError:
        pass

    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        try:
            parsed = json.loads(match.group(0))
            return parsed if isinstance(parsed, list) else None
        except json.JSONDecodeError:
            pass

    return None

################################################################################################################
# Question generation
def generate_mcq(chunk: str, n: int = 3):
    messages = [{
        "role": "user",
        "content": (
            f"You are a quiz question writer. Based ONLY on the text below, "
            f"generate {n} multiple choice questions.\n"
            "Rules:\n"
            "- Each question must have exactly 4 options labelled A, B, C, D.\n"
            "- Only one option is correct.\n"
            "- Make the incorrect options plausible but clearly wrong to an expert.\n"
            "- Do not reference 'the text' or 'the passage' in the questions.\n"
            "- Respond ONLY with a valid JSON array. No markdown, no explanation.\n\n"
            "Format:\n"
            "[\n"
            "  {\n"
            '    "question": "...",\n'
            '    "options": {"A": "...", "B": "...", "C": "...", "D": "..."},\n'
            '    "answer": "B"\n'
            "  }\n"
            "]\n\n"
            f"Text:\n{chunk}"
        )
    }]

    raw = run_inference(messages, max_tokens=768)
    parsed = _parse_json_array(raw)

    if parsed is None:
        print(f"MCQ JSON parse failed. Snippet: {raw[:300]}")
        return []

    validated = []
    for item in parsed:
        if not _validate_mcq(item):
            print(f"Skipping invalid MCQ: {item}")
            continue
        validated.append({
            "type": "Multiple Choice",
            "question": item["question"].strip(),
            "options": item["options"],
            "answer_letter": item["answer"].upper(),
            "answer_text": item["options"][item["answer"].upper()]
        })
    return validated

def _validate_mcq(item: dict):
    return (
        isinstance(item, dict)
        and isinstance(item.get("question"), str)
        and len(item["question"].strip()) > 0
        and isinstance(item.get("options"), dict)
        and set(item["options"].keys()) >= {"A", "B", "C", "D"}
        and isinstance(item.get("answer"), str)
        and item["answer"].upper() in item["options"]
    )

def generate_short_answer(chunk: str, n: int = 3):
    messages = [{
        "role": "user",
        "content": (
            f"You are a quiz question writer. Based ONLY on the text below, "
            f"generate {n} short-answer questions with answers.\n"
            "Rules:\n"
            "- Each answer must be answerable in one sentence or less.\n"
            "- Do not reference 'the text' or 'the passage' in the questions.\n"
            "- Respond ONLY with a valid JSON array. No markdown, no explanation.\n\n"
            "Format:\n"
            "[\n"
            "  {\n"
            '    "question": "...",\n'
            '    "answer": "..."\n'
            "  }\n"
            "]\n\n"
            f"Text:\n{chunk}"
        )
    }]

    raw = run_inference(messages, max_tokens=512)
    parsed = _parse_json_array(raw)

    if parsed is None:
        print(f"Short-answer JSON parse failed. Snippet: {raw[:300]}")
        return []

    validated = []
    for item in parsed:
        if not _validate_short_answer(item):
            print(f"Skipping invalid short-answer: {item}")
            continue
        validated.append({
            "type": "Short Answer",
            "question": item["question"].strip(),
            "answer": item["answer"].strip()
        })
    return validated

def _validate_short_answer(item: dict):
    return (
        isinstance(item, dict)
        and isinstance(item.get("question"), str)
        and len(item["question"].strip()) > 4
        and isinstance(item.get("answer"), str)
        and len(item["answer"].strip()) > 0
    )

def generate_fill_blank(chunk: str, n: int = 3):
    messages = [{
        "role": "user",
        "content": (
            f"You are a quiz question writer. Based ONLY on the text below, "
            f"generate {n} fill-in-the-blank questions.\n"
            "Rules:\n"
            "- Replace one key word or phrase in a sentence with a blank shown as _____.\n"
            "- The blank must be a specific fact from the text, not a vague word.\n"
            "- Include the correct answer for each blank.\n"
            "- Do not reference 'the text' or 'the passage' in the questions.\n"
            "- Respond ONLY with a valid JSON array. No markdown, no explanation.\n\n"
            "Format:\n"
            "[\n"
            "  {\n"
            '    "question": "...",\n'
            '    "answer": "..."\n'
            "  }\n"
            "]\n\n"
            f"Text:\n{chunk}"
        )
    }]

    raw = run_inference(messages, max_tokens=512)
    parsed = _parse_json_array(raw)

    if parsed is None:
        print(f"Fill-blank JSON parse failed. Snippet: {raw[:300]}")
        return []

    validated = []
    for item in parsed:
        if not _validate_fill_blank(item):
            print(f"Skipping invalid fill-blank: {item}")
            continue
        validated.append({
            "type": "Fill in the Blank",
            "question": item["question"].strip(),
            "answer": item["answer"].strip()
        })
    return validated

def _validate_fill_blank(item: dict):
    return (
        isinstance(item, dict)
        and isinstance(item.get("question"), str)
        and "_____" in item["question"]
        and isinstance(item.get("answer"), str)
        and len(item["answer"].strip()) > 0
    )

def generate_true_false(chunk: str, n: int = 3):
    messages = [{
        "role": "user",
        "content": (
            f"You are a quiz question writer. Based ONLY on the text below, "
            f"generate {n} true or false questions.\n"
            "Rules:\n"
            "- Each statement must be clearly true or false based on the text.\n"
            "- Mix true and false statements — do not make them all true or all false.\n"
            "- Keep each statement short and unambiguous.\n"
            "- Do not reference 'the text' or 'the passage' in the statements.\n"
            "- Respond ONLY with a valid JSON array. No markdown, no explanation.\n\n"
            "Format:\n"
            "[\n"
            "  {\n"
            '    "question": "The Eiffel Tower is located in London.",\n'
            '    "answer": "False"\n'
            "  }\n"
            "]\n\n"
            f"Text:\n{chunk}"
        )
    }]

    raw = run_inference(messages, max_tokens=512)
    parsed = _parse_json_array(raw)

    if parsed is None:
        print(f"True/false JSON parse failed. Snippet: {raw[:300]}")
        return []

    validated = []
    for item in parsed:
        if not _validate_true_false(item):
            print(f"Skipping invalid true/false: {item}")
            continue
        validated.append({
            "type": "True/False",
            "question": item["question"].strip(),
            "answer": item["answer"].strip()
        })
    return validated

def _validate_true_false(item: dict):
    return (
        isinstance(item, dict)
        and isinstance(item.get("question"), str)
        and len(item["question"].strip()) > 4
        and isinstance(item.get("answer"), str)
        and item["answer"].strip().lower() in ("true", "false")
    )

################################################################################################################
# Core functions
def save_outputs(questions: list[dict]):
    df = pd.DataFrame(questions)

    if "options" in df.columns:
        options_expanded = df["options"].apply(
            lambda x: pd.Series(x) if isinstance(x, dict) else pd.Series()
        )
        options_expanded.columns = [f"option_{c}" for c in options_expanded.columns]
        df = pd.concat([df.drop(columns=["options"]), options_expanded], axis=1)

    df.to_csv(
        "generated_questions.csv",
        index=False,
        encoding="utf-8-sig",
        quotechar='"',
        quoting=csv.QUOTE_ALL
    )
    with open("generated_questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

def generate_questions(
    path: str,
    question_type,
    max_chars: int = 1500,
    questions_per_chunk: int = 3
):
    check_ollama()

    print(f"Extracting text from: {path}")
    text = extract_text(path)
    chunks = chunk_text(text, max_chars)
    print(
        f"{len(chunks)} chunk(s) | type: {question_type} | "
        f"{questions_per_chunk} questions per chunk"
    )

    all_questions: list[dict] = []

    for idx, chunk in enumerate(tqdm(chunks, desc="Generating", unit="chunk")):
        print(f"\nChunk {idx + 1}/{len(chunks)} ({len(chunk)} chars)")
        if question_type == "mcq":
            results = generate_mcq(chunk, questions_per_chunk)
        elif question_type == "short":
            results = generate_short_answer(chunk, questions_per_chunk)
        elif question_type == "fill":
            results = generate_fill_blank(chunk, questions_per_chunk)
        elif question_type == "truefalse":
            results = generate_true_false(chunk, questions_per_chunk)

        all_questions.extend(results)
        print(f"Chunk {idx + 1}: got {len(results)} question(s)")

    save_outputs(all_questions)
    return all_questions

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("file")
    parser.add_argument(
        "--type",
	choices=["mcq", "short", "fill", "truefalse"],
        default="short"
    )
    
    # for testing
    parser.add_argument("--max-chars", type=int, default=1500)
    parser.add_argument("--questions-per-chunk", type=int, default=3)
    return parser.parse_args()

if __name__ == "__main__":

    try:

        args = parse_args()

        result = generate_questions(
            path=args.file,
            question_type=args.type,
            max_chars=args.max_chars,
            questions_per_chunk=args.questions_per_chunk
        )

        print(f"\n{len(result)} question(s) saved.")
        print("CSV -> generated_questions.csv")
        print("JSON -> generated_questions.json")

        sys.exit(0)

    except Exception as e:

        print(f"ERROR: {e}")
        sys.exit(1)