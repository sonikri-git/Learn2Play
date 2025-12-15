// src/app/core/api/files.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, map } from 'rxjs';

interface UploadResponse {
  fileId: string | null;
  originalName: string | null;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class FilesService {
  // 👇 change this if your backend runs on a different host/port
  private apiUrl = 'http://localhost:8080';

  constructor(private http: HttpClient) {}

  upload(file: File): Observable<{ type: 'progress' | 'done'; value: number; fileId?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events',
    }).pipe(
      map((event: HttpEvent<UploadResponse>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const total = event.total ?? 1;
          const progress = Math.round((event.loaded / total) * 100);
          return { type: 'progress', value: progress };
        }

        if (event.type === HttpEventType.Response) {
          const body = event.body;
          return {
            type: 'done',
            value: 100,
            fileId: body?.fileId ?? undefined,
          };
        }

        // ignore other events
        return { type: 'progress', value: 0 };
      })
    );
  }
}
