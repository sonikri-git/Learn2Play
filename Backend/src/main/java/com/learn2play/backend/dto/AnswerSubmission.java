package com.learn2play.backend.dto;

public class AnswerSubmission {
    private Long questionId;
    private String selectedAnswerLetter;
    private String selectedAnswerText;

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getSelectedAnswerLetter() {
        return selectedAnswerLetter;
    }

    public void setSelectedAnswerLetter(String selectedAnswerLetter) {
        this.selectedAnswerLetter = selectedAnswerLetter;
    }

    public String getSelectedAnswerText() {
        return selectedAnswerText;
    }

    public void setSelectedAnswerText(String selectedAnswerText) {
        this.selectedAnswerText = selectedAnswerText;
    }
}
