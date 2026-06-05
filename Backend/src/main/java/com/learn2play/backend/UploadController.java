package com.learn2play.backend;

import com.learn2play.backend.dto.QuizAttemptRequest;
import com.learn2play.backend.dto.QuizAttemptResponse;
import com.learn2play.backend.dto.QuizResponse;
import com.learn2play.backend.entity.Quiz;
import com.learn2play.backend.entity.UploadedDocument;
import com.learn2play.backend.repository.UploadedDocumentRepository;
import com.learn2play.backend.service.QuizPersistenceService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:4200")
@RestController
public class UploadController {

    private static final long MAX_FILE_SIZE_BYTES = 100L * 1024L * 1024L;

    private final QuizGenerator quizGenerator;
    private final UploadedDocumentRepository uploadedDocumentRepository;
    private final QuizPersistenceService quizPersistenceService;

    public UploadController(QuizGenerator quizGenerator,
                            UploadedDocumentRepository uploadedDocumentRepository,
                            QuizPersistenceService quizPersistenceService) {
        this.quizGenerator = quizGenerator;
        this.uploadedDocumentRepository = uploadedDocumentRepository;
        this.quizPersistenceService = quizPersistenceService;
    }

    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "questionType", defaultValue = "short")
            String questionType) {

        System.out.println(
            "QUESTION TYPE RECEIVED: "
            + questionType
        );

        UploadedDocument document = null;

        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, null, "File is empty"));
            }

            String originalName = file.getOriginalFilename();
            if (originalName == null || !originalName.contains(".")) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, null, "File must have an extension"));
            }

            String safeOriginalName = Paths.get(originalName).getFileName().toString();
            String ext = safeOriginalName.substring(safeOriginalName.lastIndexOf('.') + 1)
                    .toLowerCase(Locale.ROOT);

            if (!isAllowedExtension(ext)) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, safeOriginalName,
                                "Only .pdf, .docx, .txt and .md files are allowed"));
            }

            if (file.getSize() > MAX_FILE_SIZE_BYTES) {
                return ResponseEntity.badRequest()
                        .body(new UploadResponse(null, safeOriginalName,
                                "File is too large. Maximum size is 100 MB"));
            }

            Path uploadDir = Paths.get("uploads");
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String fileId = UUID.randomUUID().toString();
            String storedFileName = fileId + "-" + safeOriginalName;
            Path filePath = uploadDir.resolve(storedFileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            document = new UploadedDocument(
                    fileId,
                    safeOriginalName,
                    storedFileName,
                    filePath.toString(),
                    file.getContentType(),
                    file.getSize(),
                    "UPLOADED",
                    "File uploaded successfully"
            );
            document = uploadedDocumentRepository.save(document);

            String relativePath = uploadDir.resolve(storedFileName).toString();
            List<QuizItem> generatedQuestions =
                    quizGenerator.generateQuizForFile(
                            relativePath,
                            questionType
                    );
            Quiz savedQuiz = quizPersistenceService.saveGeneratedQuiz(document, generatedQuestions);

            document.setStatus("QUIZ_GENERATED");
            document.setMessage("File uploaded and quiz generated successfully");
            uploadedDocumentRepository.save(document);

            return ResponseEntity.ok(new UploadResponse(
                    fileId,
                    safeOriginalName,
                    "File uploaded and quiz generated successfully",
                    document.getId(),
                    savedQuiz.getId()
            ));

        } catch (Exception e) {
            e.printStackTrace();

            if (document != null) {
                document.setStatus("FAILED");
                document.setMessage("Upload saved but quiz generation failed: " + e.getMessage());
                uploadedDocumentRepository.save(document);
            }

            return ResponseEntity.status(500)
                    .body(new UploadResponse(null, null, "Error uploading file or generating quiz"));
        }
    }

    // Backward-compatible endpoint used by Angular right now.
    @GetMapping("/quiz")
    public ResponseEntity<List<QuizItem>> getLatestQuiz() {
        try {
            List<QuizItem> questions = quizPersistenceService.getLatestQuizItems();
            if (questions == null || questions.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(questions);
        } catch (Exception noSavedQuizYet) {
            List<QuizItem> fallbackQuestions = quizGenerator.getLastQuiz();
            if (fallbackQuestions == null || fallbackQuestions.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.ok(fallbackQuestions);
        }
    }

    // Better endpoint for the final version because it includes quizId.
    @GetMapping("/quiz/latest")
    public ResponseEntity<QuizResponse> getLatestQuizWithId() {
        return ResponseEntity.ok(quizPersistenceService.getLatestQuizResponse());
    }

    // Endpoint for saving user answers and score.
    @PostMapping("/quiz/{quizId}/attempts")
    public ResponseEntity<QuizAttemptResponse> submitQuizAttempt(@PathVariable Long quizId,
                                                                 @RequestBody QuizAttemptRequest request) {
        return ResponseEntity.ok(quizPersistenceService.submitAttempt(quizId, request));
    }

    private boolean isAllowedExtension(String ext) {
        return ext.equals("pdf") ||
               ext.equals("docx") ||
               ext.equals("txt") ||
               ext.equals("md");
    }
}
