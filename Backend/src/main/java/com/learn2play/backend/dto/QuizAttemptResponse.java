package com.learn2play.backend.dto;

public class QuizAttemptResponse {
    private Long attemptId;
    private Long quizId;
    private int totalQuestions;
    private int correctCount;
    private double scorePercent;
    private String message;

    public QuizAttemptResponse() {
    }

    public QuizAttemptResponse(Long attemptId, Long quizId, int totalQuestions, int correctCount, double scorePercent, String message) {
        this.attemptId = attemptId;
        this.quizId = quizId;
        this.totalQuestions = totalQuestions;
        this.correctCount = correctCount;
        this.scorePercent = scorePercent;
        this.message = message;
    }

    public Long getAttemptId() {
        return attemptId;
    }

    public void setAttemptId(Long attemptId) {
        this.attemptId = attemptId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(int correctCount) {
        this.correctCount = correctCount;
    }

    public double getScorePercent() {
        return scorePercent;
    }

    public void setScorePercent(double scorePercent) {
        this.scorePercent = scorePercent;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
