import { Injectable } from '@angular/core';
import { delay, of, throwError } from 'rxjs';
import { TokenStorage } from './token-storage';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(email: string, password: string) {
    if (!email || !password) return throwError(() => new Error('Invalid')).pipe(delay(300));
    TokenStorage.set('dev-token');
    return of({ accessToken: 'dev-token' }).pipe(delay(600));
  }
  logout() { TokenStorage.clear(); }
}
