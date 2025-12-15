// src/app/features/upload.page.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FilesService } from '../core/api/files.service';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

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
  template: `
  <div class="upload-page">
    <div class="hero">
      <img src="assets/logo.png" alt="Learn2Play" class="hero-logo"/>
      <h2>Upload study material</h2>
      <p class="hero-sub">
        Drag & drop files or choose from your device.
        Supported: .pdf, .docx, .txt, .md (≤ 100MB each)
      </p>
    </div>

    <mat-card class="upload-card">
      <div class="dropzone"
           (dragover)="onDragOver($event)"
           (drop)="onDrop($event)"
           [class.active]="dragging">
        <div class="drop-inner">
          <div class="icon-wrap" aria-hidden="true">
            <mat-icon class="upl-icon">cloud_upload</mat-icon>
          </div>
          <p class="drop-note">Drag & drop files here, or</p>
          <label class="choose-btn">
            <input type="file"
                   multiple
                   (change)="onPick($event)"
                   accept=".pdf,.docx,.txt,.md" />
            Choose files
          </label>

          <!-- Selected files list -->
          <ul *ngIf="selectedFiles().length" class="selected-list">
            <li *ngFor="let f of selectedFiles(); let i = index">
              {{ i + 1 }}. {{ f.name }} ({{ (f.size / 1024 | number:'1.0-0') }} KB)
            </li>
          </ul>
          <p *ngIf="!selectedFiles().length" class="selected">No files selected</p>
        </div>
      </div>

      <div class="actions">
        <button mat-stroked-button
                color="primary"
                (click)="startUpload()"
                [disabled]="!selectedFiles().length || uploading()">
          <mat-icon>arrow_upward</mat-icon>
          Upload ({{ selectedFiles().length }})
        </button>

        <button mat-button
                color="warn"
                (click)="clear()"
                [disabled]="uploading()">
          <mat-icon>clear</mat-icon>
          Clear
        </button>
      </div>

      <mat-progress-bar *ngIf="uploading()"
                        mode="determinate"
                        [value]="progress()">
      </mat-progress-bar>

      <div class="meta" *ngIf="fileIds().length">
        <mat-icon>check_circle</mat-icon>
        Uploaded —
        <span *ngFor="let id of fileIds(); let i = index">
          <strong>{{ id }}</strong><span *ngIf="i < fileIds().length - 1">, </span>
        </span>
      </div>
    </mat-card>
  </div>
  `,
  styleUrls: ['./upload.page.scss']
})
export class UploadPage {
  private filesService = inject(FilesService);
  private sb = inject(MatSnackBar);
  private router = inject(Router);

  // signals
  selectedFiles = signal<File[]>([]);
  uploading = signal(false);
  progress = signal(0); // overall percent 0-100
  fileIds = signal<string[]>([]);
  dragging = false;

  // selection handlers
  onPick(e: Event) {
    const list = (e.target as HTMLInputElement).files;
    if (!list || list.length === 0) return;
    this.selectedFiles.set(Array.from(list));
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.dragging = true;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    const list = e.dataTransfer?.files;
    if (!list || list.length === 0) return;
    this.selectedFiles.set(Array.from(list));
  }

  clear() {
    this.selectedFiles.set([]);
    this.fileIds.set([]);
    this.progress.set(0);
  }

  // helper to validate single file
  private validateFile(f: File): string | null {
    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    if (!['pdf', 'docx', 'txt', 'md'].includes(ext)) return 'Invalid file type';
    if (f.size > 100 * 1024 * 1024) return 'File too large (>100MB)';
    return null;
  }

  // unique id generator (fallback if backend sends no fileId)
  private genUniqueId(idx: number) {
    return `mock-${Date.now()}-${Math.floor(Math.random() * 100000)}-${idx}`;
  }

  // upload all files (tracks overall progress)
  startUpload() {
    const files = this.selectedFiles();
    if (!files.length) {
      this.sb.open('No files selected', 'Close', { duration: 2000 });
      return;
    }

    // validate all files first
    for (const f of files) {
      const err = this.validateFile(f);
      if (err) {
        this.sb.open(`${f.name}: ${err}`, 'Close', { duration: 3000 });
        return;
      }
    }

    this.uploading.set(true);
    this.progress.set(0);
    this.fileIds.set([]);

    const total = files.length;
    let completed = 0;

    files.forEach((file, idx) => {
      const obs: Observable<any> = this.filesService.upload(file);

      obs.subscribe({
        next: (ev: any) => {
          console.log('Upload event from backend', { file: file.name, ev });

          // progress updates
          if (ev?.type === 'progress' && typeof ev.value === 'number') {
            const overall = Math.round(((completed + ev.value / 100) / total) * 100);
            this.progress.set(overall);
            return;
          }

          // final response
          if (ev?.type === 'done') {
            const thisFileId: string = ev.fileId ?? this.genUniqueId(idx);

            this.fileIds.update(ids => [...ids, thisFileId]);
            completed++;
            this.progress.set(Math.round((completed / total) * 100));

            console.log('✅ Upload finished', { file: file.name, fileId: thisFileId });

            if (completed === total) {
              this.uploading.set(false);
              this.sb.open('All uploads complete. Loading quiz…', 'Close', { duration: 1800 });

              // 🔁 go to quiz page
              this.router.navigate(['/quiz']);
            }
          }
        },
        error: (err) => {
          console.error('❌ Upload failed', { file: file.name, err });
          this.sb.open(`Upload failed: ${file.name}`, 'Close', { duration: 2500 });

          completed++;
          if (completed >= total) {
            this.uploading.set(false);
          }
        },
        complete: () => {
          // no-op; HttpClient already sent the final 'done' event
        }
      });
    });
  }
}
