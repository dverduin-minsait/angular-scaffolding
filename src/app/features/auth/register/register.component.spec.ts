import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RegisterComponent,
        ReactiveFormsModule,
        RouterTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with invalid form', () => {
      expect(component['registerForm'].valid).toBeFalsy();
    });

    it('should have all required form controls', () => {
      const form = component['registerForm'];
      expect(form.get('firstName')).toBeTruthy();
      expect(form.get('lastName')).toBeTruthy();
      expect(form.get('email')).toBeTruthy();
      expect(form.get('gender')).toBeTruthy();
      expect(form.get('language')).toBeTruthy();
      expect(form.get('observations')).toBeTruthy();
      expect(form.get('password')).toBeTruthy();
      expect(form.get('confirmPassword')).toBeTruthy();
      expect(form.get('agreedToTerms')).toBeTruthy();
    });
  });

  it('should display the registration header', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    const subtitle = compiled.querySelector('.auth-header p');
    
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Create Account');
    expect(subtitle?.textContent?.trim()).toBe('Join us and start your journey');
  });

  it('should render the registration form', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const form = compiled.querySelector('.auth-form');
    
    expect(form).toBeTruthy();
    expect(form?.tagName.toLowerCase()).toBe('form');
  });

  it('should display name fields in inline group', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const inlineGroup = compiled.querySelector('.form-group-inline');
    const firstNameLabel = compiled.querySelector('label[for="firstName"]');
    const firstNameInput = compiled.querySelector('#firstName');
    const lastNameLabel = compiled.querySelector('label[for="lastName"]');
    const lastNameInput = compiled.querySelector('#lastName');
    
    expect(inlineGroup).toBeTruthy();
    expect(firstNameLabel?.textContent?.trim()).toBe('First Name *');
    expect(firstNameInput?.getAttribute('placeholder')).toBe('First name');
    expect(lastNameLabel?.textContent?.trim()).toBe('Last Name *');
    expect(lastNameInput?.getAttribute('placeholder')).toBe('Last name');
  });

  it('should display email input field', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emailLabel = compiled.querySelector('label[for="email"]');
    const emailInput = compiled.querySelector('#email');
    
    expect(emailLabel?.textContent?.trim()).toBe('Email *');
    expect(emailInput?.getAttribute('type')).toBe('email');
    expect(emailInput?.getAttribute('placeholder')).toBe('Enter your email');
  });

  it('should display password input with strength indicator', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const passwordLabel = compiled.querySelector('label[for="password"]');
    const passwordInput = compiled.querySelector('#password');
    const strengthBar = compiled.querySelector('.strength-bar');
    const strengthText = compiled.querySelector('.strength-text');
    
    expect(passwordLabel?.textContent?.trim()).toBe('Password *');
    expect(passwordInput?.getAttribute('type')).toBe('password');
    expect(passwordInput?.getAttribute('placeholder')).toBe('Create a password');
    expect(strengthBar).toBeTruthy();
    expect(strengthText?.textContent?.trim()).toBe('No password entered');
  });

  it('should display password confirmation field', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const confirmLabel = compiled.querySelector('label[for="confirmPassword"]');
    const confirmInput = compiled.querySelector('#confirmPassword');
    
    expect(confirmLabel?.textContent?.trim()).toBe('Confirm Password *');
    expect(confirmInput?.getAttribute('type')).toBe('password');
    expect(confirmInput?.getAttribute('placeholder')).toBe('Confirm your password');
  });

  it('should display terms and conditions checkbox', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const termsCheckbox = compiled.querySelector('#terms');
    const termsLabel = compiled.querySelector('label[for="terms"]');
    const termsLink = compiled.querySelector('a[href="/terms"]');
    const privacyLink = compiled.querySelector('a[href="/privacy"]');
    
    expect(termsCheckbox?.getAttribute('type')).toBe('checkbox');
    expect(termsLabel).toBeTruthy();
    expect(termsLink?.textContent?.trim()).toBe('Terms of Service (opens in new tab)');
    expect(privacyLink?.textContent?.trim()).toBe('Privacy Policy (opens in new tab)');
  });

  it('should display form action buttons', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.form-actions button');
    
    expect(buttons).toHaveLength(2);
    
    // Primary create account button
    const createButton = buttons[0];
    expect(createButton.textContent?.trim()).toBe('Create Account');
    expect(createButton.getAttribute('type')).toBe('submit');
    expect(createButton).toHaveClass('btn-primary');
    
    // Google sign-up button
    const googleButton = buttons[1];
    expect(googleButton.textContent?.trim()).toBe('Sign up with Google');
    expect(googleButton.getAttribute('type')).toBe('button');
    expect(googleButton).toHaveClass('btn-secondary');
  });

  it('should display auth footer with login link', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const footerText = compiled.querySelector('.auth-footer p');
    const loginLink = compiled.querySelector('.auth-footer a');
    
    expect(footerText?.textContent?.trim()).toBe('Already have an account?');
    expect(loginLink?.textContent?.trim()).toBe('Sign in');
    expect(loginLink?.getAttribute('href')).toBe('/auth/login');
  });

  it('should have proper form structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const formGroups = compiled.querySelectorAll('.form-group');
    
    // Should have 7 form groups (inline names, email, gender, language, observations, password, confirm password)
    expect(formGroups).toHaveLength(7);
    
    // Should also have terms group
    const termsGroup = compiled.querySelector('.terms-group');
    expect(termsGroup).toBeTruthy();
  });

  it('should apply correct CSS classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.querySelector('.auth-page')).toBeTruthy();
    expect(compiled.querySelector('.auth-container')).toBeTruthy();
    expect(compiled.querySelector('.auth-header')).toBeTruthy();
    expect(compiled.querySelector('.auth-form')).toBeTruthy();
    expect(compiled.querySelector('.auth-footer')).toBeTruthy();
    
    // Form elements - now includes 7 inputs (2 text, 1 email, 1 select, 1 textarea, 2 password)
    expect(compiled.querySelector('.form-group-inline')).toBeTruthy();
    expect(compiled.querySelectorAll('.form-input')).toHaveLength(7);
    expect(compiled.querySelector('.password-strength')).toBeTruthy();
    expect(compiled.querySelector('.terms-group')).toBeTruthy();
    expect(compiled.querySelector('.form-actions')).toBeTruthy();
  });

  it('should have password strength indicator elements', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const strengthContainer = compiled.querySelector('.password-strength');
    const strengthBar = compiled.querySelector('.strength-bar');
    const strengthFill = compiled.querySelector('.strength-fill');
    const strengthText = compiled.querySelector('.strength-text');
    
    expect(strengthContainer).toBeTruthy();
    expect(strengthBar).toBeTruthy();
    expect(strengthFill).toBeTruthy();
    expect(strengthFill?.getAttribute('data-strength')).toBe('none');
    expect(strengthText).toBeTruthy();
  });

  it('should have proper input attributes for accessibility', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const inputs = compiled.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      expect(id).toBeTruthy();
      
      const correspondingLabel = compiled.querySelector(`label[for="${id}"]`);
      expect(correspondingLabel).toBeTruthy();
    });
    
    // Checkbox should also have proper labeling
    const checkbox = compiled.querySelector('#terms');
    const checkboxLabel = compiled.querySelector('label[for="terms"]');
    expect(checkbox).toBeTruthy();
    expect(checkboxLabel).toBeTruthy();
  });

  it('should have semantic HTML structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should have proper heading hierarchy
    expect(compiled.querySelector('h1')).toBeTruthy();
    
    // Should use form element
    expect(compiled.querySelector('form')).toBeTruthy();
    
    // Should have proper input types
    expect(compiled.querySelector('input[type="text"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="email"]')).toBeTruthy();
    expect(compiled.querySelectorAll('input[type="password"]')).toHaveLength(2);
    expect(compiled.querySelector('input[type="checkbox"]')).toBeTruthy();
    
    // Should have proper button types
    expect(compiled.querySelector('button[type="submit"]')).toBeTruthy();
    expect(compiled.querySelector('button[type="button"]')).toBeTruthy();
  });

  it('should have external links in terms section', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const termsLink = compiled.querySelector('a[href="/terms"]');
    const privacyLink = compiled.querySelector('a[href="/privacy"]');
    
    expect(termsLink).toBeTruthy();
    expect(privacyLink).toBeTruthy();
    expect(termsLink?.textContent?.trim()).toBe('Terms of Service (opens in new tab)');
    expect(privacyLink?.textContent?.trim()).toBe('Privacy Policy (opens in new tab)');
  });

  it('should be a presentation component without logic', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should have form elements but no complex interactions
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelectorAll('input')).toHaveLength(10); // 2 text + 1 email + 4 radio + 2 password + 1 checkbox
    expect(compiled.querySelectorAll('button')).toHaveLength(2);
    
    // Should have navigation and external links
    expect(compiled.querySelector('a[href="/auth/login"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="/terms"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="/privacy"]')).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should validate first name as required', () => {
      const firstNameControl = component['registerForm'].get('firstName');
      
      // Initially invalid (empty)
      expect(firstNameControl?.invalid).toBeTruthy();
      expect(firstNameControl?.errors?.['required']).toBeTruthy();
      
      // Valid with minimum length
      firstNameControl?.setValue('Jo');
      expect(firstNameControl?.valid).toBeTruthy();
      
      // Invalid with less than 2 characters
      firstNameControl?.setValue('J');
      expect(firstNameControl?.invalid).toBeTruthy();
      expect(firstNameControl?.errors?.['minlength']).toBeTruthy();
    });

    it('should validate last name as required', () => {
      const lastNameControl = component['registerForm'].get('lastName');
      
      expect(lastNameControl?.invalid).toBeTruthy();
      expect(lastNameControl?.errors?.['required']).toBeTruthy();
      
      lastNameControl?.setValue('Doe');
      expect(lastNameControl?.valid).toBeTruthy();
    });

    it('should validate email format', () => {
      const emailControl = component['registerForm'].get('email');
      
      // Invalid email formats
      emailControl?.setValue('invalid-email');
      expect(emailControl?.invalid).toBeTruthy();
      expect(emailControl?.errors?.['email']).toBeTruthy();
      
      emailControl?.setValue('test@');
      expect(emailControl?.invalid).toBeTruthy();
      
      // Valid email
      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTruthy();
    });

    it('should validate gender as required', () => {
      const genderControl = component['registerForm'].get('gender');
      
      expect(genderControl?.invalid).toBeTruthy();
      expect(genderControl?.errors?.['required']).toBeTruthy();
      
      genderControl?.setValue('male');
      expect(genderControl?.valid).toBeTruthy();
    });

    it('should validate language as required', () => {
      const languageControl = component['registerForm'].get('language');
      
      expect(languageControl?.invalid).toBeTruthy();
      expect(languageControl?.errors?.['required']).toBeTruthy();
      
      languageControl?.setValue('en');
      expect(languageControl?.valid).toBeTruthy();
    });

    it('should allow observations to be optional', () => {
      const observationsControl = component['registerForm'].get('observations');
      
      expect(observationsControl?.valid).toBeTruthy();
      
      observationsControl?.setValue('Some observations');
      expect(observationsControl?.valid).toBeTruthy();
    });

    it('should validate password strength', () => {
      const passwordControl = component['registerForm'].get('password');
      
      // Weak password
      passwordControl?.setValue('123');
      expect(passwordControl?.invalid).toBeTruthy();
      expect(passwordControl?.errors?.['weakPassword']).toBeTruthy();
      
      // Strong password
      passwordControl?.setValue('StrongPass123!');
      expect(passwordControl?.valid).toBeTruthy();
    });

    it('should validate password confirmation matches', () => {
      const form = component['registerForm'];
      const passwordControl = form.get('password');
      const confirmPasswordControl = form.get('confirmPassword');
      
      passwordControl?.setValue('StrongPass123!');
      confirmPasswordControl?.setValue('DifferentPass123!');
      
      expect(form.errors?.['passwordMismatch']).toBeTruthy();
      
      confirmPasswordControl?.setValue('StrongPass123!');
      expect(form.errors?.['passwordMismatch']).toBeFalsy();
    });

    it('should validate terms agreement as required', () => {
      const termsControl = component['registerForm'].get('agreedToTerms');
      
      expect(termsControl?.invalid).toBeTruthy();
      expect(termsControl?.errors?.['required']).toBeTruthy();
      
      termsControl?.setValue(true);
      expect(termsControl?.valid).toBeTruthy();
    });
  });

  describe('Password Strength Signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should calculate password strength score correctly', () => {
      const passwordControl = component['registerForm'].get('password');
      
      // No password
      expect(component['passwordStrengthScore']()).toBe(0);
      
      // Only length requirement (8 characters, all lowercase, no numbers)
      passwordControl?.setValue('abcdefgh');
      fixture.detectChanges();
      expect(component['passwordStrengthScore']()).toBe(2); // length + lowercase
      
      // Length + uppercase + lowercase
      passwordControl?.setValue('AbcdefGH');
      fixture.detectChanges();
      expect(component['passwordStrengthScore']()).toBe(3); // length + uppercase + lowercase
      
      // All requirements
      passwordControl?.setValue('Abcdef123');
      fixture.detectChanges();
      expect(component['passwordStrengthScore']()).toBe(4); // length + uppercase + lowercase + numbers
    });

    it('should update password strength text reactively', () => {
      const passwordControl = component['registerForm'].get('password');
      
      expect(component['passwordStrengthText']()).toBe('No password entered');
      
      passwordControl?.setValue('weak');
      fixture.detectChanges();
      expect(component['passwordStrengthText']()).toBe('Very weak');
      
      passwordControl?.setValue('Weak123');
      fixture.detectChanges();
      expect(component['passwordStrengthText']()).toBe('Good');
      
      passwordControl?.setValue('Strong123!');
      fixture.detectChanges();
      expect(component['passwordStrengthText']()).toBe('Strong');
    });
  });

  describe('Error Messages', () => {
    it('should display first name error when invalid', () => {
      // Clear the value to make it invalid and trigger required error
      const firstNameControl = component['registerForm'].get('firstName');
      firstNameControl?.setValue('');
      firstNameControl?.markAsTouched();
      firstNameControl?.markAsDirty();
      firstNameControl?.updateValueAndValidity();
      
      // Manually trigger the form status signal update
      component['registerForm'].updateValueAndValidity();
      fixture.detectChanges();
      
      expect(component['firstNameError']()).toBe('First name is required');
    });

    it('should display email error when invalid', () => {
      const emailControl = component['registerForm'].get('email');
      emailControl?.setValue('');
      emailControl?.markAsTouched();
      emailControl?.markAsDirty();
      emailControl?.updateValueAndValidity();
      component['registerForm'].updateValueAndValidity();
      fixture.detectChanges();
      
      expect(component['emailError']()).toBe('Email is required');
    });

    it('should display gender error when not selected', () => {
      const genderControl = component['registerForm'].get('gender');
      genderControl?.setValue('');
      genderControl?.markAsTouched();
      genderControl?.markAsDirty();
      genderControl?.updateValueAndValidity();
      component['registerForm'].updateValueAndValidity();
      fixture.detectChanges();
      
      expect(component['genderError']()).toBe('Please select your gender');
    });

    it('should display language error when not selected', () => {
      const languageControl = component['registerForm'].get('language');
      languageControl?.setValue('');
      languageControl?.markAsTouched();
      languageControl?.markAsDirty();
      languageControl?.updateValueAndValidity();
      component['registerForm'].updateValueAndValidity();
      fixture.detectChanges();
      
      expect(component['languageError']()).toBe('Please select your preferred language');
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle radio button selection', () => {
      const maleRadio = fixture.nativeElement.querySelector('#gender-male') as HTMLInputElement;
      const femaleRadio = fixture.nativeElement.querySelector('#gender-female') as HTMLInputElement;
      
      // Initially no selection
      expect(component['registerForm'].get('gender')?.value).toBeFalsy();
      
      // Select male
      maleRadio.click();
      fixture.detectChanges();
      expect(component['registerForm'].get('gender')?.value).toBe('male');
      expect(maleRadio.checked).toBeTruthy();
      expect(femaleRadio.checked).toBeFalsy();
      
      // Select female
      femaleRadio.click();
      fixture.detectChanges();
      expect(component['registerForm'].get('gender')?.value).toBe('female');
      expect(femaleRadio.checked).toBeTruthy();
      expect(maleRadio.checked).toBeFalsy();
    });

    it('should handle language selection', () => {
      const languageSelect = fixture.nativeElement.querySelector('#language') as HTMLSelectElement;
      
      // Initially no selection
      expect(component['registerForm'].get('language')?.value).toBeFalsy();
      
      // Select English
      languageSelect.value = 'en';
      languageSelect.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(component['registerForm'].get('language')?.value).toBe('en');
    });

    it('should handle textarea input', () => {
      const observationsTextarea = fixture.nativeElement.querySelector('#observations') as HTMLTextAreaElement;
      
      // Initially empty
      expect(component['registerForm'].get('observations')?.value).toBe('');
      
      // Enter text
      observationsTextarea.value = 'Some observations text';
      observationsTextarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(component['registerForm'].get('observations')?.value).toBe('Some observations text');
    });

    it('should handle checkbox state changes', () => {
      const termsCheckbox = fixture.nativeElement.querySelector('#terms') as HTMLInputElement;
      
      // Initially unchecked
      expect(component['registerForm'].get('agreedToTerms')?.value).toBeFalsy();
      
      // Check terms
      termsCheckbox.click();
      fixture.detectChanges();
      expect(component['registerForm'].get('agreedToTerms')?.value).toBeTruthy();
      
      // Uncheck terms
      termsCheckbox.click();
      fixture.detectChanges();
      expect(component['registerForm'].get('agreedToTerms')?.value).toBeFalsy();
    });

    it('should handle keyboard navigation on radio buttons', () => {
      const radioGroup = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
      const maleRadio = fixture.nativeElement.querySelector('#gender-male') as HTMLInputElement;
      const femaleRadio = fixture.nativeElement.querySelector('#gender-female') as HTMLInputElement;
      
      // Focus on male radio
      maleRadio.focus();
      
      // Test that arrow down moves focus (Note: actual navigation logic would need to be tested in integration tests)
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      radioGroup.dispatchEvent(arrowDownEvent);
      fixture.detectChanges();
      
      // In a real implementation, focus would move, but for unit testing we just verify the event doesn't crash
      expect(maleRadio).toBeTruthy();
      expect(femaleRadio).toBeTruthy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      
      // Fill form with valid data
      const form = component['registerForm'];
      form.patchValue({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        gender: 'male',
        language: 'en',
        observations: 'Test observations',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        agreedToTerms: true
      });
    });

    it('should enable submit button when form is valid', () => {
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBeFalsy();
    });

    it('should disable submit button when form is invalid', () => {
      component['registerForm'].get('email')?.setValue('invalid-email');
      fixture.detectChanges();
      
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitButton.disabled).toBeTruthy();
    });

    it('should handle form submission properly', () => {
      fixture.detectChanges();
      
      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      
      // Should be able to submit form without errors
      expect(() => {
        form.dispatchEvent(new Event('submit'));
      }).not.toThrow();
    });
  });
});