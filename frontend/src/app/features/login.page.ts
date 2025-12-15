// src/app/features/login.page.ts
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  template: `
  <div class="page">
    <!-- 🎬 HERO VIDEO SECTION -->
    <header class="hero">
      <video class="bg-video" autoplay muted loop playsinline preload="metadata">
        <source src="assets/hero-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div class="hero-overlay">
        <img class="hero-logo" src="assets/logo.png" alt="Learn2Play logo" />
        <h1 class="hero-title">Learn2Play</h1>
        <p class="hero-sub">Study smarter, play better.</p>
      </div>
    </header>

    <!-- 🔑 LOGIN CARD -->
    <main class="center-wrap">
      <mat-card class="login-card" role="form" aria-labelledby="loginTitle">
        <h2 id="loginTitle">Welcome Back</h2>
        <p class="subtitle">Sign in to continue to your dashboard</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <mat-form-field appearance="outline" class="field">
            <mat-label>Email</mat-label>
            <mat-icon matPrefix>mail</mat-icon>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-error *ngIf="form.controls.email.touched && form.controls.email.hasError('required')">Email required</mat-error>
            <mat-error *ngIf="form.controls.email.touched && form.controls.email.hasError('email')">Enter a valid email</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="field">
            <mat-label>Password</mat-label>
            <mat-icon matPrefix>lock</mat-icon>
            <input matInput [type]="isPasswordVisible() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" />
            <button mat-icon-button matSuffix type="button" (click)="togglePassword()" aria-label="Toggle password">
              <mat-icon>{{ isPasswordVisible() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.controls.password.touched && form.controls.password.hasError('required')">Password required</mat-error>
            <mat-error *ngIf="form.controls.password.touched && form.controls.password.hasError('minlength')">Minimum 4 characters</mat-error>
          </mat-form-field>

          <div class="row">
            <mat-checkbox formControlName="remember">Remember me</mat-checkbox>
            <a class="forgot" href="#" (click)="$event.preventDefault()">Forgot password?</a>
          </div>

          <button mat-raised-button class="btn-primary" type="submit" [disabled]="form.invalid || isLoading()">
            <ng-container *ngIf="!isLoading()">Sign in</ng-container>
            <ng-container *ngIf="isLoading()"><span class="spinner"></span> Signing in…</ng-container>
          </button>
        </form>

        <div class="card-footer">
          <span>New here?</span>
          <a href="#" (click)="$event.preventDefault()">Create an account</a>
        </div>
      </mat-card>
    </main>

    <footer class="site-footer">© {{ year }} Learn2Play • Capstone Project</footer>
  </div>
  `,
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private sb = inject(MatSnackBar);

  year = new Date().getFullYear();
  private loading = signal(false);
  private passwordVisible = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    remember: [true]
  });
ngAfterViewInit() {
  const v = document.querySelector('.bg-video') as HTMLVideoElement;
  if (v) {
    const tryPlay = () => v.play().catch(() => setTimeout(tryPlay, 500));
    tryPlay();
  }
}

  isLoading() { return this.loading(); }
  isPasswordVisible() { return this.passwordVisible(); }
  togglePassword() { this.passwordVisible.update(v => !v); }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/upload');
      },
      error: (err) => {
        this.loading.set(false);
        this.sb.open(err?.message || 'Login failed', 'Close', { duration: 3000 });
      }
    });
  }
}
