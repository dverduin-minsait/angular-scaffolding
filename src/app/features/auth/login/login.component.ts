import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from '../../../shared/directives/button.directive';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonDirective],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <header class="auth-header">
          <h1 id="login-title">Login</h1>
          <p>Sign in to your account</p>
        </header>
        
        <form class="crud-form" 
              (ngSubmit)="onSubmit()" 
              #loginForm="ngForm"
              aria-labelledby="login-title"
              novalidate>
          
          <div class="form-field">
            <label class="form-label" for="email">Email <span aria-label="required">*</span></label>
            <input 
              id="email" 
              name="email"
              type="email" 
              placeholder="Enter your email"
              class="form-control"
              [(ngModel)]="formData().email"
              required
              email
              autocomplete="email"
              [attr.aria-invalid]="emailError() ? 'true' : 'false'"
              [attr.aria-describedby]="emailError() ? 'email-error' : null"
              #emailField="ngModel"
            />
            @if (emailError()) {
              <div id="email-error" class="form-error" role="alert" aria-live="polite">
                {{ emailError() }}
              </div>
            }
          </div>
          
          <div class="form-field">
            <label class="form-label" for="password">Password <span aria-label="required">*</span></label>
            <input 
              id="password" 
              name="password"
              type="password" 
              placeholder="Enter your password"
              class="form-control"
              [(ngModel)]="formData().password"
              required
              minlength="6"
              autocomplete="current-password"
              [attr.aria-invalid]="passwordError() ? 'true' : 'false'"
              [attr.aria-describedby]="passwordError() ? 'password-error' : null"
              #passwordField="ngModel"
            />
            @if (passwordError()) {
              <div id="password-error" class="form-error" role="alert" aria-live="polite">
                {{ passwordError() }}
              </div>
            }
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              appButton variant="primary"
              [disabled]="loginForm.invalid || isSubmitting()"
              [attr.aria-describedby]="submitError() ? 'submit-error' : null"
            >
              {{ isSubmitting() ? 'Signing In...' : 'Sign In' }}
            </button>
            <button 
              type="button" 
              appButton variant="secondary"
              (click)="signInWithGoogle()"
              [disabled]="isSubmitting()"
            >
              Sign in with Google
            </button>
          </div>
          
          @if (submitError()) {
            <div id="submit-error" class="form-error" role="alert" aria-live="assertive">
              {{ submitError() }}
            </div>
          }
        </form>
        
        <footer class="auth-footer">
          <p>Don't have an account?</p>
          <a routerLink="/auth/register" aria-label="Go to registration page">Create an account</a>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  protected readonly formData = signal({
    email: '',
    password: ''
  });
  
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');

  protected onSubmit(): void {
    this.clearErrors();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting.set(false);
      // Simulate success or error
    }, 1000);
  }
  
  protected signInWithGoogle(): void {
  }
  
  private validateForm(): boolean {
    let isValid = true;
    const data = this.formData();
    
    if (!data.email) {
      this.emailError.set('Email is required');
      isValid = false;
    } else if (!this.isValidEmail(data.email)) {
      this.emailError.set('Please enter a valid email address');
      isValid = false;
    }
    
    if (!data.password) {
      this.passwordError.set('Password is required');
      isValid = false;
    } else if (data.password.length < 6) {
      this.passwordError.set('Password must be at least 6 characters');
      isValid = false;
    }
    
    return isValid;
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private clearErrors(): void {
    this.emailError.set('');
    this.passwordError.set('');
    this.submitError.set('');
  }
}