package com.learn2play.backend;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

public class QuizItem {

    private Long id;
    private String type;
    private String question;
    private Map<String, String> options;

    @JsonProperty("answer_letter")
    private String answerLetter;

    @JsonProperty("answer_text")
    private String answerText;

    // Used by short-answer questions from quizgen.py
    private String answer;

    public QuizItem() {
    }

    public QuizItem(String type, String question) {
        this.type = type;
        this.question = question;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getQuestion() {
        return question;
    }

    public void setQuestion(String question) {
        this.question = question;
    }

    public Map<String, String> getOptions() {
        return options;
    }

    public void setOptions(Map<String, String> options) {
        this.options = options;
    }

    public String getAnswerLetter() {
        return answerLetter;
    }

    public void setAnswerLetter(String answerLetter) {
        this.answerLetter = answerLetter;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }
}
