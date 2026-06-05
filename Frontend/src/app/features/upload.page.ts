// ============================================
// upload.page.ts
// UPDATED VERSION WITH QUESTION TYPES
// ============================================

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Observable } from 'rxjs';

import { FilesService } from '../core/api/files.service';

@Component({
  standalone: true,
  selector: 'app-upload',

  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatSnackBarModule
  ],

  templateUrl: './upload.page.html',

  styleUrls: ['./upload.page.scss']
})

export class UploadPage {

  // =====================================
  // SERVICES
  // =====================================

  private filesService =
    inject(FilesService);

  private sb =
    inject(MatSnackBar);

  private router =
    inject(Router);

  // =====================================
  // SIGNALS
  // =====================================

  selectedFiles = signal<File[]>([]);

  uploading = signal(false);

  progress = signal(0);
isGenerating = signal(false);
  fileIds = signal<string[]>([]);

  dragging = false;

  // =====================================
  // QUESTION TYPES
  // =====================================

  selectedQuestionTypes: string[] = [];

  // =====================================
  // FILE PICKER
  // =====================================

  onFileSelected(event: Event): void {

    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const files =
      Array.from(input.files);

    const validFiles: File[] = [];

    files.forEach(file => {

      const error =
        this.validateFile(file);

      if (error) {

        this.sb.open(
          `${file.name}: ${error}`,
          'Close',
          { duration: 3000 }
        );

      } else {

        validFiles.push(file);
      }
    });

    this.selectedFiles.set(validFiles);
  }

  // =====================================
  // DRAG EVENTS
  // =====================================

  onDragOver(event: DragEvent): void {

    event.preventDefault();

    this.dragging = true;
  }

  onDragLeave(event: DragEvent): void {

    event.preventDefault();

    this.dragging = false;
  }

  onDrop(event: DragEvent): void {

    event.preventDefault();

    this.dragging = false;

    const files =
      event.dataTransfer?.files;

    if (
      !files ||
      files.length === 0
    ) {
      return;
    }

    const droppedFiles =
      Array.from(files);

    const validFiles: File[] = [];

    droppedFiles.forEach(file => {

      const error =
        this.validateFile(file);

      if (error) {

        this.sb.open(
          `${file.name}: ${error}`,
          'Close',
          { duration: 3000 }
        );

      } else {

        validFiles.push(file);
      }
    });

    this.selectedFiles.set(validFiles);
  }

  // =====================================
  // FILE VALIDATION
  // =====================================

  private validateFile(
    file: File
  ): string | null {

    const allowedExtensions = [
      'pdf',
      'doc',
      'docx',
      'txt',
      'ppt',
      'pptx'
    ];

    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() || '';

    if (
      !allowedExtensions.includes(
        extension
      )
    ) {
      return 'Unsupported file type';
    }

    // 100MB LIMIT

    const maxSize =
      100 * 1024 * 1024;

    if (file.size > maxSize) {
      return 'File exceeds 100MB';
    }

    return null;
  }

  // =====================================
  // REMOVE FILE
  // =====================================

  removeFile(index: number): void {

    const updatedFiles = [
      ...this.selectedFiles()
    ];

    updatedFiles.splice(index, 1);

    this.selectedFiles.set(updatedFiles);
  }

  // =====================================
  // CLEAR FILES
  // =====================================

  clear(): void {

    this.selectedFiles.set([]);

    this.fileIds.set([]);

    this.progress.set(0);

    this.selectedQuestionTypes = [];
  }

  // =====================================
  // TOGGLE QUESTION TYPES
  // =====================================

  toggleQuestionType(type: string): void {

    const exists =
      this.selectedQuestionTypes.includes(type);

    if (exists) {

      this.selectedQuestionTypes =
        this.selectedQuestionTypes.filter(
          t => t !== type
        );

    } else {

      this.selectedQuestionTypes.push(type);
    }

    console.log(
      'Selected Question Types:',
      this.selectedQuestionTypes
    );
  }

  // =====================================
  // START UPLOAD
  // =====================================

  startUpload(): void {

    const files =
      this.selectedFiles();

    // CHECK FILES

    if (!files.length) {

      this.sb.open(
        'No files selected',
        'Close',
        { duration: 2000 }
      );

      return;
    }

    // CHECK QUESTION TYPES

    if (
      this.selectedQuestionTypes.length === 0
    ) {

      this.sb.open(
        'Please select at least one question type',
        'Close',
        { duration: 2500 }
      );

      return;
    }

    this.uploading.set(true);
    

    this.progress.set(0);

    this.fileIds.set([]);

    const total = files.length;

    let completed = 0;

   files.forEach((file, idx) => {

console.log(
  'Selected Question Types:',
  this.selectedQuestionTypes
);
let selectedType = 'short';

if (
  this.selectedQuestionTypes.includes('MCQ')
) {
  selectedType = 'mcq';
}
else if (
  this.selectedQuestionTypes.includes('TRUE_FALSE')
) {
  selectedType = 'truefalse';
}
else if (
  this.selectedQuestionTypes.includes('FILL_BLANKS')
) {
  selectedType = 'fill';
}
else if (
  this.selectedQuestionTypes.includes('SHORT_ANSWER')
) {
  selectedType = 'short';
}

console.log(
  'Selected Types:',
  this.selectedQuestionTypes
);

console.log(
  'Sending Type:',
  selectedType
);
const obs: Observable<any> =
  this.filesService.upload(
    file,
    selectedType
  );

      obs.subscribe({

        next: (ev: any) => {

          console.log(
            'Upload Event',
            {
              file: file.name,
              questionTypes:
                this.selectedQuestionTypes,
              ev
            }
          );

          // PROGRESS

          if (
            ev?.type === 'progress' &&
            typeof ev.value === 'number'
          ) {

            const overall =
              Math.round(
                (
                  (
                    completed +
                    ev.value / 100
                  ) / total
                ) * 100
              );

            this.progress.set(overall);

            return;
          }

          // DONE

          if (ev?.type === 'done') {

            const thisFileId =
              ev.fileId ??
              `file-${idx + 1}`;

            this.fileIds.update(ids => [
              ...ids,
              thisFileId
            ]);

            completed++;

            this.progress.set(
              Math.round(
                (
                  completed / total
                ) * 100
              )
            );

            console.log(
              'Upload Completed',
              {
                file: file.name,
                questionTypes:
                  this.selectedQuestionTypes,
                fileId: thisFileId
              }
            );

            // ALL COMPLETE

            if (
              completed === total
            ) {

              this.uploading.set(false);

              this.sb.open(
                'Files uploaded successfully!',
                'Close',
                { duration: 2500 }
              );

              // NEXT PAGE

            this.router.navigate([
  '/quiz'
]);
            }
          }
        },

        error: (err) => {

          console.error(
            'Upload Failed',
            {
              file: file.name,
              err
            }
          );

          this.sb.open(
            `Upload failed: ${file.name}`,
            'Close',
            { duration: 3000 }
          );

          completed++;

          if (
            completed >= total
          ) {
            this.uploading.set(false);
          }
        }
      });
    });
  }
}