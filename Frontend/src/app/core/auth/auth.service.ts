import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private api = 'http://localhost:8080/auth';

  register(user: any) {
    return this.http.post(
      `${this.api}/register`,
      user
    );
  }

  login(user: any) {
  return this.http.post(
    `${this.api}/login`,
    user
  );
}
}