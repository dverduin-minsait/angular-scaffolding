import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <header class="auth-header">
          <h1 id="register-title">Create Account</h1>
          <p>Join us and start your journey</p>
        </header>
        
        <form class="auth-form" 
              (ngSubmit)="onSubmit()" 
              #registerForm="ngForm"
              aria-labelledby="register-title"
              novalidate>
              
          <fieldset class="form-group form-group-inline">
            <legend class="visually-hidden">Personal Information</legend>
            <div>
              <label for="firstName">First Name <span aria-label="required">*</span></label>
              <input 
                id="firstName" 
                name="firstName"
                type="text" 
                placeholder="First name"
                class="form-input"
                [(ngModel)]="formData().firstName"
                required
                autocomplete="given-name"
                [attr.aria-invalid]="firstNameError() ? 'true' : 'false'"
                [attr.aria-describedby]="firstNameError() ? 'firstName-error' : null"
                #firstNameField="ngModel"
              />
              @if (firstNameError()) {
                <div id="firstName-error" class="error-message" role="alert" aria-live="polite">
                  {{ firstNameError() }}
                </div>
              }
            </div>
            <div>
              <label for="lastName">Last Name <span aria-label="required">*</span></label>
              <input 
                id="lastName" 
                name="lastName"
                type="text" 
                placeholder="Last name"
                class="form-input"
                [(ngModel)]="formData().lastName"
                required
                autocomplete="family-name"
                [attr.aria-invalid]="lastNameError() ? 'true' : 'false'"
                [attr.aria-describedby]="lastNameError() ? 'lastName-error' : null"
                #lastNameField="ngModel"
              />
              @if (lastNameError()) {
                <div id="lastName-error" class="error-message" role="alert" aria-live="polite">
                  {{ lastNameError() }}
                </div>
              }
            </div>
          </fieldset>
          
          <div class="form-group">
            <label for="email">Email <span aria-label="required">*</span></label>
            <input 
              id="email" 
              name="email"
              type="email" 
              placeholder="Enter your email"
              class="form-input"
              [(ngModel)]="formData().email"
              required
              email
              autocomplete="email"
              [attr.aria-invalid]="emailError() ? 'true' : 'false'"
              [attr.aria-describedby]="emailError() ? 'email-error' : null"
              #emailField="ngModel"
            />
            @if (emailError()) {
              <div id="email-error" class="error-message" role="alert" aria-live="polite">
                {{ emailError() }}
              </div>
            }
          </div>
          
          <div class="form-group">
            <label for="password">Password <span aria-label="required">*</span></label>
            <input 
              id="password" 
              name="password"
              type="password" 
              placeholder="Create a password"
              class="form-input"
              [(ngModel)]="formData().password"
              required
              minlength="8"
              autocomplete="new-password"
              [attr.aria-invalid]="passwordError() ? 'true' : 'false'"
              [attr.aria-describedby]="'password-requirements ' + (passwordError() ? 'password-error' : '')"
              (input)="checkPasswordStrength()"
              #passwordField="ngModel"
            />
            <div id="password-requirements" class="password-requirements">
              <p>Password requirements:</p>
              <ul>
                <li [attr.aria-label]="hasMinLength() ? 'Requirement met' : 'Requirement not met'">
                  <span [attr.aria-hidden]="true">{{ hasMinLength() ? '✓' : '✗' }}</span>
                  At least 8 characters
                </li>
                <li [attr.aria-label]="hasUpperCase() ? 'Requirement met' : 'Requirement not met'">
                  <span [attr.aria-hidden]="true">{{ hasUpperCase() ? '✓' : '✗' }}</span>
                  One uppercase letter
                </li>
                <li [attr.aria-label]="hasLowerCase() ? 'Requirement met' : 'Requirement not met'">
                  <span [attr.aria-hidden]="true">{{ hasLowerCase() ? '✓' : '✗' }}</span>
                  One lowercase letter
                </li>
                <li [attr.aria-label]="hasNumber() ? 'Requirement met' : 'Requirement not met'">
                  <span [attr.aria-hidden]="true">{{ hasNumber() ? '✓' : '✗' }}</span>
                  One number
                </li>
              </ul>
            </div>
            <div class="password-strength">
              <div class="strength-bar" role="progressbar" 
                   [attr.aria-valuenow]="passwordStrengthScore()" 
                   aria-valuemin="0" 
                   aria-valuemax="4"
                   [attr.aria-label]="'Password strength: ' + passwordStrengthText()">
                <div class="strength-fill" [class]="passwordStrengthClass()"></div>
              </div>
              <span class="strength-text">{{ passwordStrengthText() }}</span>
            </div>
            @if (passwordError()) {
              <div id="password-error" class="error-message" role="alert" aria-live="polite">
                {{ passwordError() }}
              </div>
            }
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password <span aria-label="required">*</span></label>
            <input 
              id="confirmPassword" 
              name="confirmPassword"
              type="password" 
              placeholder="Confirm your password"
              class="form-input"
              [(ngModel)]="formData().confirmPassword"
              required
              autocomplete="new-password"
              [attr.aria-invalid]="confirmPasswordError() ? 'true' : 'false'"
              [attr.aria-describedby]="confirmPasswordError() ? 'confirmPassword-error' : null"
              #confirmPasswordField="ngModel"
            />
            @if (confirmPasswordError()) {
              <div id="confirmPassword-error" class="error-message" role="alert" aria-live="polite">
                {{ confirmPasswordError() }}
              </div>
            }
          </div>
          
          <div class="terms-group">
            <input 
              type="checkbox" 
              id="terms" 
              name="terms"
              [(ngModel)]="formData().agreedToTerms"
              required
              [attr.aria-invalid]="termsError() ? 'true' : 'false'"
              [attr.aria-describedby]="termsError() ? 'terms-error' : null"
              #termsField="ngModel"
            />
            <label for="terms">
              I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service <span class="visually-hidden">(opens in new tab)</span></a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy <span class="visually-hidden">(opens in new tab)</span></a>
            </label>
            @if (termsError()) {
              <div id="terms-error" class="error-message" role="alert" aria-live="polite">
                {{ termsError() }}
              </div>
            }
          </div>
          
          <div class="form-actions">
            <button 
              type="submit" 
              class="btn-primary"
              [disabled]="registerForm.invalid || isSubmitting()"
              [attr.aria-describedby]="submitError() ? 'submit-error' : null"
            >
              {{ isSubmitting() ? 'Creating Account...' : 'Create Account' }}
            </button>
            <button 
              type="button" 
              class="btn-secondary"
              (click)="signUpWithGoogle()"
              [disabled]="isSubmitting()"
            >
              Sign up with Google
            </button>
          </div>
          
          @if (submitError()) {
            <div id="submit-error" class="error-message" role="alert" aria-live="assertive">
              {{ submitError() }}
            </div>
          }
        </form>
        
        <footer class="auth-footer">
          <p>Already have an account?</p>
          <a href="/login" aria-label="Go to login page">Sign in</a>
        </footer>
      </div>
    </div>
  `,
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  protected readonly formData = signal({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false
  });
  
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  protected readonly firstNameError = signal('');
  protected readonly lastNameError = signal('');
  protected readonly emailError = signal('');
  protected readonly passwordError = signal('');
  protected readonly confirmPasswordError = signal('');
  protected readonly termsError = signal('');
  
  // Password strength indicators
  protected readonly hasMinLength = computed(() => this.formData().password.length >= 8);
  protected readonly hasUpperCase = computed(() => /[A-Z]/.test(this.formData().password));
  protected readonly hasLowerCase = computed(() => /[a-z]/.test(this.formData().password));
  protected readonly hasNumber = computed(() => /\d/.test(this.formData().password));
  
  protected readonly passwordStrengthScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperCase()) score++;
    if (this.hasLowerCase()) score++;
    if (this.hasNumber()) score++;
    return score;
  });
  
  protected readonly passwordStrengthClass = computed(() => {
    const score = this.passwordStrengthScore();
    if (score === 0) return 'none';
    if (score === 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
  });
  
  protected readonly passwordStrengthText = computed(() => {
    const score = this.passwordStrengthScore();
    if (score === 0) return 'No password entered';
    if (score === 1) return 'Very weak';
    if (score === 2) return 'Weak';
    if (score === 3) return 'Good';
    return 'Strong';
  });

  protected onSubmit(): void {
    this.clearErrors();
    
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting.set(false);
      console.log('Registration attempt with:', this.formData());
    }, 1000);
  }
  
  protected signUpWithGoogle(): void {
    console.log('Google sign up clicked');
  }
  
  protected checkPasswordStrength(): void {
    // This method is called on password input to trigger strength updates
    // The actual strength calculation is handled by computed signals
  }
  
  private validateForm(): boolean {
    let isValid = true;
    const data = this.formData();
    
    if (!data.firstName.trim()) {
      this.firstNameError.set('First name is required');
      isValid = false;
    }
    
    if (!data.lastName.trim()) {
      this.lastNameError.set('Last name is required');
      isValid = false;
    }
    
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
    } else if (this.passwordStrengthScore() < 3) {
      this.passwordError.set('Password must meet at least 3 requirements');
      isValid = false;
    }
    
    if (!data.confirmPassword) {
      this.confirmPasswordError.set('Please confirm your password');
      isValid = false;
    } else if (data.password !== data.confirmPassword) {
      this.confirmPasswordError.set('Passwords do not match');
      isValid = false;
    }
    
    if (!data.agreedToTerms) {
      this.termsError.set('You must agree to the Terms of Service and Privacy Policy');
      isValid = false;
    }
    
    return isValid;
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  private clearErrors(): void {
    this.firstNameError.set('');
    this.lastNameError.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.confirmPasswordError.set('');
    this.termsError.set('');
    this.submitError.set('');
  }
}