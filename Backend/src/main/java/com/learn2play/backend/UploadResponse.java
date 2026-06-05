package com.learn2play.backend;

public class UploadResponse {

    private String fileId;
    private String fileName;
    private String message;
    private Long documentId;
    private Long quizId;

    public UploadResponse() {
    }

    public UploadResponse(String fileId, String fileName, String message) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.message = message;
    }

    public UploadResponse(String fileId, String fileName, String message, Long documentId, Long quizId) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.message = message;
        this.documentId = documentId;
        this.quizId = quizId;
    }

    public String getFileId() {
        return fileId;
    }

    public void setFileId(String fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getDocumentId() {
        return documentId;
    }

    public void setDocumentId(Long documentId) {
        this.documentId = documentId;
    }

    public Long getQuizId() {
        return quizId;
    }

    public void setQuizId(Long quizId) {
        this.quizId = quizId;
    }
}
