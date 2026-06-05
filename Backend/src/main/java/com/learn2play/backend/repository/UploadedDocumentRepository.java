package com.learn2play.backend.repository;

import com.learn2play.backend.entity.UploadedDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UploadedDocumentRepository extends JpaRepository<UploadedDocument, Long> {
    Optional<UploadedDocument> findByFileId(String fileId);
    Optional<UploadedDocument> findTopByOrderByUploadedAtDesc();
}
