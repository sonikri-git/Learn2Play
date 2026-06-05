package com.learn2play.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
public class QuizGenerator {

	private final ObjectMapper objectMapper;
	private List<QuizItem> lastQuiz = new ArrayList<>();

	public QuizGenerator(ObjectMapper objectMapper) {
	    this.objectMapper = objectMapper;
	}

	public List<QuizItem> generateQuizForFile(
	        String relativePath,
	        String questionType) {

	    try {
	        Path projectRootPath = Paths.get(System.getProperty("user.dir"));

	        Path windowsPython = projectRootPath
	                .resolve("venv-quiz")
	                .resolve("Scripts")
	                .resolve("python.exe");

	        String pythonCommand = Files.exists(windowsPython)
	                ? windowsPython.toString()
	                : "python";

	        Path quizgenScript =
	                projectRootPath.resolve("ai").resolve("quizgen.py");

	        Path sourceFilePath =
	                projectRootPath.resolve(relativePath);

	        System.out.println(
	                "[quizgen] Question Type = "
	                        + questionType
	        );

	        System.out.println(
	                "[quizgen] Using Python: "
	                        + pythonCommand
	        );

	        System.out.println(
	                "[quizgen] Using script: "
	                        + quizgenScript
	        );

	        System.out.println(
	                "[quizgen] Using source file: "
	                        + sourceFilePath
	        );

	        ProcessBuilder pb = new ProcessBuilder(
	                pythonCommand,
	                quizgenScript.toString(),
	                sourceFilePath.toString(),
	                "--type",
	                questionType,
	                "--questions-per-chunk",
	                "3"
	        );

	        pb.directory(
	                new File(projectRootPath.toString())
	        );

	        pb.redirectErrorStream(true);

	        Process process = pb.start();

	        try (
	                BufferedReader reader =
	                        new BufferedReader(
	                                new InputStreamReader(
	                                        process.getInputStream()
	                                )
	                        )
	        ) {
	            String line;

	            while ((line = reader.readLine()) != null) {
	                System.out.println(
	                        "[quizgen] " + line
	                );
	            }
	        }

	        int exitCode = process.waitFor();

	        if (exitCode != 0) {
	            throw new RuntimeException(
	                    "quizgen.py failed with exit code "
	                            + exitCode
	            );
	        }

	        Path jsonPath =
	                projectRootPath.resolve(
	                        "generated_questions.json"
	                );

	        if (!Files.exists(jsonPath)) {
	            throw new RuntimeException(
	                    "generated_questions.json not found at: "
	                            + jsonPath.toAbsolutePath()
	            );
	        }

	        String json =
	                Files.readString(jsonPath);

	        QuizItem[] arr =
	                objectMapper.readValue(
	                        json,
	                        QuizItem[].class
	                );

	        lastQuiz = Arrays.asList(arr);

	        System.out.println(
	                "[quizgen] Loaded "
	                        + lastQuiz.size()
	                        + " questions"
	        );

	        return lastQuiz;

	    } catch (Exception e) {
	        e.printStackTrace();

	        throw new RuntimeException(
	                "Failed to generate quiz",
	                e
	        );
	    }
	}

	public List<QuizItem> getLastQuiz() {
	    return lastQuiz;
	}}
