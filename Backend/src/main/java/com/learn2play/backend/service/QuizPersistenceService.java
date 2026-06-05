package com.learn2play.backend.service;

import com.learn2play.backend.QuizItem;
import com.learn2play.backend.dto.AnswerSubmission;
import com.learn2play.backend.dto.QuizAttemptRequest;
import com.learn2play.backend.dto.QuizAttemptResponse;
import com.learn2play.backend.dto.QuizResponse;
import com.learn2play.backend.entity.Question;
import com.learn2play.backend.entity.Quiz;
import com.learn2play.backend.entity.QuizAttempt;
import com.learn2play.backend.entity.UploadedDocument;
import com.learn2play.backend.entity.UserAnswer;
import com.learn2play.backend.repository.QuestionRepository;
import com.learn2play.backend.repository.QuizAttemptRepository;
import com.learn2play.backend.repository.QuizRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuizPersistenceService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final QuizAttemptRepository quizAttemptRepository;

    public QuizPersistenceService(QuizRepository quizRepository,
                                  QuestionRepository questionRepository,
                                  QuizAttemptRepository quizAttemptRepository) {
        this.quizRepository = quizRepository;
        this.questionRepository = questionRepository;
        this.quizAttemptRepository = quizAttemptRepository;
    }

    @Transactional
    public Quiz saveGeneratedQuiz(UploadedDocument document, List<QuizItem> generatedItems) {
        String title = "Quiz for " + document.getOriginalFileName();
        Quiz quiz = new Quiz(document, title);

        int order = 1;
        for (QuizItem item : generatedItems) {
            Question question = new Question(
                    item.getType() == null ? "Unknown" : item.getType(),
                    item.getQuestion(),
                    order++
            );

            Map<String, String> options = item.getOptions();
            if (options != null) {
                question.setOptionA(options.get("A"));
                question.setOptionB(options.get("B"));
                question.setOptionC(options.get("C"));
                question.setOptionD(options.get("D"));
            }

            question.setCorrectAnswerLetter(item.getAnswerLetter());
            question.setCorrectAnswerText(item.getAnswerText() != null ? item.getAnswerText() : item.getAnswer());
            quiz.addQuestion(question);
        }

        return quizRepository.save(quiz);
    }

    @Transactional(readOnly = true)
    public QuizResponse getLatestQuizResponse() {
        Quiz quiz = quizRepository.findTopByOrderByCreatedAtDesc()
                .orElseThrow(() -> new IllegalStateException("No quiz found yet"));
        List<QuizItem> items = getQuizItems(quiz.getId());
        return new QuizResponse(quiz.getId(), quiz.getTitle(), items);
    }

    @Transactional(readOnly = true)
    public List<QuizItem> getLatestQuizItems() {
        return getLatestQuizResponse().getQuestions();
    }

    @Transactional(readOnly = true)
    public List<QuizItem> getQuizItems(Long quizId) {
        return questionRepository.findByQuizIdOrderBySortOrderAsc(quizId)
                .stream()
                .map(this::toQuizItem)
                .collect(Collectors.toList());
    }

    @Transactional
    public QuizAttemptResponse submitAttempt(Long quizId, QuizAttemptRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new IllegalArgumentException("Quiz not found: " + quizId));

        Map<Long, Question> questionsById = questionRepository.findByQuizIdOrderBySortOrderAsc(quizId)
                .stream()
                .collect(Collectors.toMap(Question::getId, q -> q));

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setUserEmail(request.getUserEmail() == null || request.getUserEmail().isBlank()
                ? "guest@learn2play.local"
                : request.getUserEmail());

        int correctCount = 0;

        for (AnswerSubmission submitted : request.getAnswers()) {
            Question question = questionsById.get(submitted.getQuestionId());
            if (question == null) {
                continue;
            }

            boolean correct = isCorrect(question, submitted);
            if (correct) {
                correctCount++;
            }

            UserAnswer answer = new UserAnswer();
            answer.setQuestion(question);
            answer.setSelectedAnswerLetter(normalize(submitted.getSelectedAnswerLetter()));
            answer.setSelectedAnswerText(submitted.getSelectedAnswerText());
            answer.setCorrect(correct);
            attempt.addAnswer(answer);
        }

        int total = questionsById.size();
        double scorePercent = total == 0 ? 0 : (correctCount * 100.0) / total;

        attempt.setTotalQuestions(total);
        attempt.setCorrectCount(correctCount);
        attempt.setScorePercent(scorePercent);

        QuizAttempt savedAttempt = quizAttemptRepository.save(attempt);

        return new QuizAttemptResponse(
                savedAttempt.getId(),
                quizId,
                total,
                correctCount,
                Math.round(scorePercent * 100.0) / 100.0,
                "Quiz attempt saved successfully"
        );
    }

    private QuizItem toQuizItem(Question question) {
        QuizItem item = new QuizItem();
        item.setId(question.getId());
        item.setType(question.getType());
        item.setQuestion(question.getQuestionText());

        Map<String, String> options = new HashMap<>();
        putIfNotBlank(options, "A", question.getOptionA());
        putIfNotBlank(options, "B", question.getOptionB());
        putIfNotBlank(options, "C", question.getOptionC());
        putIfNotBlank(options, "D", question.getOptionD());
        item.setOptions(options.isEmpty() ? null : options);

        // Keeping correct answers in the response helps your current demo/result page.
        // Later, you can hide these fields until after the user submits the quiz.
        item.setAnswerLetter(question.getCorrectAnswerLetter());
        item.setAnswerText(question.getCorrectAnswerText());
        item.setAnswer(question.getCorrectAnswerText());
        return item;
    }

    private boolean isCorrect(Question question, AnswerSubmission submitted) {
        String selectedLetter = normalize(submitted.getSelectedAnswerLetter());
        String correctLetter = normalize(question.getCorrectAnswerLetter());

        if (correctLetter != null && selectedLetter != null) {
            return correctLetter.equals(selectedLetter);
        }

        String selectedText = normalizeText(submitted.getSelectedAnswerText());
        String correctText = normalizeText(question.getCorrectAnswerText());
        return correctText != null && correctText.equals(selectedText);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private String normalizeText(String value) {
        return value == null || value.isBlank() ? null : value.trim().toLowerCase();
    }

    private void putIfNotBlank(Map<String, String> map, String key, String value) {
        if (value != null && !value.isBlank()) {
            map.put(key, value);
        }
    }
}
