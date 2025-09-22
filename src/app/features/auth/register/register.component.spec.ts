import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
    expect(loginLink?.getAttribute('href')).toBe('/login');
  });

  it('should have proper form structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const formGroups = compiled.querySelectorAll('.form-group');
    
    // Should have 4 form groups (inline names, email, password, confirm password)
    expect(formGroups).toHaveLength(4);
    
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
    
    // Form elements
    expect(compiled.querySelector('.form-group-inline')).toBeTruthy();
    expect(compiled.querySelectorAll('.form-input')).toHaveLength(5);
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
    expect(strengthFill).toHaveClass('none');
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
    expect(compiled.querySelectorAll('input')).toHaveLength(6); // 5 text/email/password + 1 checkbox
    expect(compiled.querySelectorAll('button')).toHaveLength(2);
    
    // Should have navigation and external links
    expect(compiled.querySelector('a[href="/login"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="/terms"]')).toBeTruthy();
    expect(compiled.querySelector('a[href="/privacy"]')).toBeTruthy();
  });
});