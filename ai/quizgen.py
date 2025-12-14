import pdfplumber
from transformers import pipeline
import pandas as pd
from tqdm import tqdm
from transformers import AutoTokenizer
import re
import json
import csv
import sys
import docx

tokenizer = AutoTokenizer.from_pretrained("sshleifer/distilbart-cnn-12-6")

def extract_docx(path):
    doc = docx.Document(path)
    text = []
    for para in doc.paragraphs:
        if para.text.strip():
            text.append(para.text)
    return "\n".join(text)

def extract_txt(path):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def extract_pdf(path):
    text = ""
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text(path):
    ext = path.lower().split('.')[-1]
    if ext == "pdf":
        return extract_pdf(path)
    elif ext == "docx":
        return extract_docx(path)
    elif ext == "txt":
        return extract_txt(path)
    else:
        raise ValueError(f"Unsupported file type: .{ext}")

def remove_repeats(text):
    sentences = re.split(r'(?<=[.!?])\s+', text)
    seen = set()
    cleaned = []
    for s in sentences:
        s = s.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            cleaned.append(s)
    return ' '.join(cleaned)

def clean_questions(questions):
    cleaned = []
    seen = set()
    meta_patterns = [
        r"generate (a|the)? question",
        r"generate questions",
        r"generating questions",
        r"how do you generate",
        r"how to generate",
        r"about the topic in the text",
        r"from the text",
        r"question from the text",
        r"based on the text",
        r"from the context",
        r"answer a question",
        r"question generation",
        r"process itself"
    ]
    long_patterns = [
        r"\bsteps\b",
        r"\blist\b",
        r"\bexplain\b",
        r"\bdescribe\b",
        r"\boutline\b",
        r"\bprocess\b",
        r"\bwhat are the \d+ steps\b"
    ]
    for item in questions:
        q_type = item.get("type", "Short Answer")
        q = item.get("question", "").strip()

        # get rid of excess characters. model previously generating repeated question marks 
        q = q.replace("’", "'").replace("“", "").replace("”", "").replace('"', "")
        q = q.replace(',', '')
        q = re.sub(r"[!?]{2,}", "?", q)
        q = re.sub(r"\s+", " ", q).strip()
        q = re.sub(r"\?+$", "", q).strip()
        q = re.sub(r"[=?]*hl>", "", q)
        q = re.sub(r"(<hl>\s*){2,}", "<hl>", q)
        q = re.sub(r'\s*hl>', '', q)
        q = re.sub(r'\s+', ' ', q).strip()
        q = re.sub(r'(\b\w+\b)(?: \1){2,}', r'\1', q)
        q = re.sub(r'\?\s*\?', '?', q)
        q = re.sub(r'\s{2,}', ' ', q)
        q = remove_repeats(q)
        # remove questions that the model failed to generate
        if any(re.search(p, q.lower()) for p in meta_patterns):
            continue
        # remove questions that require a long response
        if any(re.search(p, q.lower()) for p in long_patterns):
            continue
        # remove questions that are too short
        if len(q.split()) < 4:
            continue
        if not re.search(r"[a-zA-Z]", q):
            continue
        if "??" in q:
            continue
        if q:
            q = q[0].upper() + q[1:]
        q = q.rstrip("?.!, ")
        q += '?'
        key = (q_type.lower(), q.lower())
        if key not in seen:
            seen.add(key)
            cleaned.append({"type": q_type, "question": q})

    return cleaned

def clean_input_text(text):
    # remove excess characters
    text = re.sub(r'[?]{2,}', '?', text)
    text = re.sub(r'(hl|HL)[\?]*', '', text)
    text = re.sub(r'^[A-Z\s]{8,}$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\?{2,}', '?', text)
    text = re.sub(r'\b(?:hl|HL)[\?]*\b', '', text)
    text = re.sub(r'\s+', ' ', text).strip()

    sentences = re.split(r'(?<=[.!?])\s+', text)
    seen = set()
    unique = []
    for s in sentences:
        key = s.lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(s)

    text = '. '.join(unique)
    text = re.sub(r'\s+', ' ', text).strip()

    return text

def chunk_text(text, max_chars=2500):
    return [text[i:i + max_chars] for i in range(0, len(text), max_chars)]

def find_key_points(summary):
    sentences = re.split(r'(?<=[.!?]) +', summary)
    return [s.strip() for s in sentences if len(s.strip()) > 50]

def iterative_summarize(chunk, summarizer, passes=3):
    current = chunk
    for _ in range(passes):
        input_length = len(current.split())
        max_len = max(60, int(input_length * 0.5))
        min_len = max(30, int(input_length * 0.3))
        current = summarizer(current, max_length=max_len, min_length=min_len, do_sample=False)[0]["summary_text"]
    return current

# iarfmoose model uses a <answer> answer text here <context> context text here format for its prompts
def extract_answers(summary):
    sentences = re.split(r'(?<=[.!?])\s+', summary)
    answer_context = []
    for s in sentences:
        s = s.strip()
        if len(s.split()) > 5:
            match = re.search(r'\b[A-Z][a-z]+\b|\b\w{6,}\b', s)
            if match:
                answer = match.group(0)
                answer_context.append({"answer": answer, "context": s})
    return answer_context

def refine_answers(pairs):
    refined = []
    for pair in pairs:
        answer = pair["answer"].strip()
        context = pair["context"].strip()

        if len(answer.split()) > 5 or len(answer) < 3:
            continue
        if not any(c.isalpha() for c in answer):
            continue
        if len(context.split()) < 5:
            continue
        if answer.lower() not in context.lower():
            continue

        refined.append(pair)
    return refined

def refine_questions(questions):
    refiner = pipeline("text2text-generation", model="google/flan-t5-large")
    refined = []

    for q in questions:
        rq = refiner(
            f"Improve this question for clarity and correctness. Only output the improved question:\n{q['question']}",
            max_new_tokens=60, do_sample=False
        )[0]["generated_text"]

        refined.append({"type": q["type"], "question": rq})

    return refined

def generate_questions(path):
    input_text = extract_text(path)
    text = clean_input_text(input_text)

    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    # summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")
    qg_model = pipeline("text2text-generation", model="iarfmoose/t5-base-question-generator")
    # qg_model = pipeline("text2text-generation", model="valhalla/t5-small-qg-hl")

    chunks = chunk_text(text)
    questions = []

    for idx, chunk in enumerate(tqdm(chunks)):
        try:
            summary = iterative_summarize(chunk, summarizer)
            answer_pairs = extract_answers(summary)
            answer_pairs = refine_answers(answer_pairs)

            for pair in answer_pairs:
                short_q_input = (
                    f"Generate a clear, natural question from the context.\n"
                    f"Only generate questions about the topic in the text. Do not generate questions about answering questions or the process itself."
                    f"<answer> {pair['answer']} <context> {pair['context']}"
                )
                short_q = qg_model(short_q_input, max_new_tokens=60, num_return_sequences=1, do_sample=False)[0]["generated_text"]                
                questions.append({"type": "Short Answer", "question": short_q}) #add "answer": pair["answer"] to show answer input

                # TODO: implement other question formats
                """scenario_prompt = (
                    f"Generate a scenario-style question that begins with 'What should you do', "
                    f"'How would you', or 'What happens if'. "
                    f"<answer> {pair['answer']} <context> {pair['context']}"
                )
                scenario_q = qg_model(scenario_prompt, max_length=150, num_return_sequences=1, do_sample=False)[0]["generated_text"]
                questions.append({"type": "Scenario", "question": scenario_q})"""

                # multiple Choice
                """mc_prompt = (
                    f"Based on the following information:\n{point}\n"
                    "Generate a multiple-choice question with 4 distinct options and specify the correct answer.\n"
                    "Format:\nQ: <question>\nA) <option>\nB) <option>\nC) <option>\nD) <option>\nAnswer: <letter>"
                )
                mc_q = qg_model(mc_prompt, max_length=200, num_return_sequences=1, do_sample=False)[0]["generated_text"]
                questions.append({"type": "Multiple Choice", "question": mc_q})"""

        except Exception as e:
            print(f"Error in section {idx+1}: {e}")

    print("Refining questions:")
    questions = refine_questions(tqdm(questions))
    print("Cleaning questions:")
    questions = clean_questions(tqdm(questions))

    # csv file
    df = pd.DataFrame(questions)
    df.to_csv("generated_questions.csv", index=False, encoding="utf-8-sig", quotechar='"', quoting=csv.QUOTE_MINIMAL)

    # json file
    with open("generated_questions.json", "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    return questions

if __name__ == "__main__":
    file = sys.argv[1]
    result = generate_questions(file)
    print("CSV saved as: generated_questions.csv")
    print("JSON saved as: generated_questions.json")