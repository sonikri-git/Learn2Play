# Learn2Play Database Setup

## What was added

The backend now saves the quiz flow in a real database using Spring Data JPA and H2.

Main tables:

- `app_users` — user profile placeholder for future real login
- `uploaded_documents` — uploaded file information
- `quizzes` — one generated quiz for an uploaded document
- `questions` — generated questions, options, and correct answer
- `quiz_attempts` — a user's quiz submission and final score
- `user_answers` — selected answer for each question
- `certificates` — placeholder table for future certificate generation

## Why H2 was used

H2 is best for the current project stage because it does not require installing MySQL. The database is created automatically when the Spring Boot backend starts.

H2 console:

- URL: `http://localhost:8080/h2-console`
- JDBC URL: `jdbc:h2:file:./data/learn2play-db`
- Username: `sa`
- Password: leave empty

## Main backend flow

1. Angular uploads a document to `POST /upload`.
2. Spring Boot saves the uploaded file in the `uploads` folder.
3. Spring Boot saves file metadata in `uploaded_documents`.
4. Spring Boot runs `ai/quizgen.py`.
5. Python generates `generated_questions.json`.
6. Spring Boot reads the JSON and saves:
   - quiz in `quizzes`
   - generated questions in `questions`
7. Angular loads the latest quiz from `GET /quiz/latest`.
8. Angular submits answers to `POST /quiz/{quizId}/attempts`.
9. Spring Boot calculates and stores the score in `quiz_attempts` and `user_answers`.

## API endpoints

### Upload and generate quiz

```http
POST /upload
```

Form-data:

```text
file = selected PDF/DOCX/TXT/MD file
```

### Get latest quiz with quiz ID

```http
GET /quiz/latest
```

### Submit quiz attempt

```http
POST /quiz/{quizId}/attempts
```

Example JSON:

```json
{
  "userEmail": "guest@learn2play.local",
  "answers": [
    {
      "questionId": 1,
      "selectedAnswerLetter": "A"
    },
    {
      "questionId": 2,
      "selectedAnswerLetter": "C"
    }
  ]
}
```

## What to tell the professor

I added the database layer for the Learn2Play backend. Now uploaded document information, generated quizzes, questions, user quiz attempts, selected answers, and scores can be stored in the database. I used Spring Data JPA with H2 for local development so the project can run without installing MySQL. This database structure supports the result page, score history, progress tracking, analytics dashboard, and future certificate generation.

## Estimated time

- Basic database setup: 4–6 hours
- Proper working database with quiz attempts and scores: 1–2 days
- Polished version with frontend result/history/progress pages: 3–5 days
