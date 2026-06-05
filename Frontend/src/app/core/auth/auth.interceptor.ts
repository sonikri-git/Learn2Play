import { HttpInterceptorFn } from '@angular/common/http';
import { TokenStorage } from './token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = TokenStorage.get();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};
