import { Component, signal, computed, inject } from '@angular/core';

import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { ButtonDirective } from '../../../shared/directives';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonDirective, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  
  // Custom validators
  private readonly passwordStrengthValidator = (control: AbstractControl): ValidationErrors | null => {
    const password = (control.value as string) || '';
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    const score = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber].filter(Boolean).length;
    
    if (password && score < 3) {
      return { weakPassword: { score, required: 3 } };
    }
    
    return null;
  };
  
  private readonly passwordMatchValidator = (form: AbstractControl): ValidationErrors | null => {
    const password = form.get('password')?.value as string;
    const confirmPassword = form.get('confirmPassword')?.value as string;
    
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    
    return null;
  };
  
  // Available gender options for selection
  protected readonly genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' }
  ];

  // Available languages for selection
  protected readonly availableLanguages = [
    { code: '', label: 'Select your preferred language' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'it', label: 'Italiano' },
    { code: 'pt', label: 'Português' },
    { code: 'ru', label: 'Русский' },
    { code: 'zh', label: '中文' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' }
  ];

  // Reactive form with built-in validators
  /* eslint-disable @typescript-eslint/unbound-method */
  protected readonly registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    gender: ['', [Validators.required]],
    language: ['', [Validators.required]],
    observations: [''], // Optional field - no validators
    password: ['', [Validators.required, this.passwordStrengthValidator.bind(this)]],
    confirmPassword: ['', [Validators.required]],
    agreedToTerms: [false, [Validators.requiredTrue]]
  }, { validators: [this.passwordMatchValidator.bind(this)] });
  /* eslint-enable @typescript-eslint/unbound-method */
  
  // UI state signals
  protected readonly isSubmitting = signal(false);
  protected readonly submitError = signal('');
  
  // Convert form valueChanges to signal for reactivity
  protected readonly formValues = toSignal(this.registerForm.valueChanges, { 
    initialValue: this.registerForm.value 
  });
  
  // Convert form statusChanges to signal for validation reactivity  
  protected readonly formStatus = toSignal(this.registerForm.statusChanges, {
    initialValue: this.registerForm.status
  });
  
  // Computed signals based on reactive form values
  protected readonly currentPassword = computed(() => {
    const values = this.formValues() as { password?: string } | null;
    return values?.password || '';
  });
  
  protected readonly hasMinLength = computed(() => this.currentPassword().length >= 8);
  protected readonly hasUpperCase = computed(() => /[A-Z]/.test(this.currentPassword()));
  protected readonly hasLowerCase = computed(() => /[a-z]/.test(this.currentPassword()));
  protected readonly hasNumber = computed(() => /\d/.test(this.currentPassword()));
  
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
    if (score === 0) return 'app.auth.register.passwordStrengthTexts.none';
    if (score === 1) return 'app.auth.register.passwordStrengthTexts.veryWeak';
    if (score === 2) return 'app.auth.register.passwordStrengthTexts.weak';
    if (score === 3) return 'app.auth.register.passwordStrengthTexts.good';
    return 'app.auth.register.passwordStrengthTexts.strong';
  });
  
  // Form validation state computed signals (reactive)
  protected readonly isFormValid = computed(() => {
    // Trigger reactivity by reading formStatus
    this.formStatus();
    return this.registerForm.valid;
  });
  
  protected readonly isFormTouched = computed(() => {
    // Trigger reactivity by reading formStatus
    this.formStatus();
    return this.registerForm.touched;
  });
  
  // Individual field error methods (for testing compatibility)
  protected firstNameError(): string {
    const control = this.registerForm.get('firstName');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.firstNameRequired';
      if (control.errors?.['minlength']) return 'app.auth.register.errors.firstNameMin';
    }
    return '';
  }
  
  protected lastNameError(): string {
    const control = this.registerForm.get('lastName');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.lastNameRequired';
      if (control.errors?.['minlength']) return 'app.auth.register.errors.lastNameMin';
    }
    return '';
  }
  
  protected emailError(): string {
    const control = this.registerForm.get('email');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.emailRequired';
      if (control.errors?.['email']) return 'app.auth.register.errors.emailInvalid';
    }
    return '';
  }
  
  protected genderError(): string {
    const control = this.registerForm.get('gender');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.genderRequired';
    }
    return '';
  }
  
  protected languageError(): string {
    const control = this.registerForm.get('language');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.languageRequired';
    }
    return '';
  }
  
  protected passwordError(): string {
    const control = this.registerForm.get('password');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.passwordRequired';
      if (control.errors?.['weakPassword']) return 'app.auth.register.errors.passwordWeak';
    }
    return '';
  }
  
  protected confirmPasswordError(): string {
    const control = this.registerForm.get('confirmPassword');
    const formErrors = this.registerForm.errors;
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.confirmPasswordRequired';
    }
    if (formErrors?.['passwordMismatch'] && control?.dirty) {
      return 'app.auth.register.errors.passwordMismatch';
    }
    return '';
  }
  
  protected termsError(): string {
    const control = this.registerForm.get('agreedToTerms');
    if (control?.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) return 'app.auth.register.errors.termsRequired';
    }
    return '';
  }

  protected onSubmit(): void {
    this.submitError.set('');
    
    if (this.registerForm.invalid) {
      // Mark all fields as touched to show validation errors
      this.registerForm.markAllAsTouched();
      return;
    }
    
    this.isSubmitting.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting.set(false);
    }, 1000);
  }
  
  protected signUpWithGoogle(): void {
  }
  
  protected checkPasswordStrength(): void {
    // This method is called on password input to trigger strength updates
    // The actual strength calculation is handled by computed signals
    // With reactive forms, this happens automatically when the form value changes
  }

  protected onRadioKeydown(event: KeyboardEvent): void {
    const target = event.target as HTMLInputElement;
    if (!target || target.type !== 'radio') return;

    const radioGroup = target.closest('.radio-options');
    if (!radioGroup) return;

    const radioButtons: HTMLInputElement[] = [
      ...radioGroup.querySelectorAll<HTMLInputElement>('input[type="radio"]')
    ];
    const currentIndex = radioButtons.indexOf(target);
    
    let nextIndex: number;
    
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % radioButtons.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? radioButtons.length - 1 : currentIndex - 1;
        break;
      default:
        return;
    }
    
    radioButtons[nextIndex].focus();
    radioButtons[nextIndex].checked = true;
    
    // Update form control value
    this.registerForm.patchValue({ gender: radioButtons[nextIndex].value });
  }
}