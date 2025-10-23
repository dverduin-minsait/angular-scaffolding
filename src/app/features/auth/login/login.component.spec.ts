import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/services/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';

class AuthServiceMock {
  login(): Promise<void> { return Promise.resolve(); }
}

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        provideHttpClient(),
        { provide: AuthService, useClass: AuthServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the login header', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h1');
    const subtitle = compiled.querySelector('.auth-header p');
    
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Login');
    expect(subtitle?.textContent?.trim()).toBe('Sign in to your account');
  });

  it('should render the login form', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
  const form = compiled.querySelector('.crud-form');
    
    expect(form).toBeTruthy();
    expect(form?.tagName.toLowerCase()).toBe('form');
  });

  it('should display email input field', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emailLabel = compiled.querySelector('label[for="email"]');
    const emailInput = compiled.querySelector('#email');
    
    expect(emailLabel).toBeTruthy();
    expect(emailLabel?.textContent?.trim()).toBe('Email *');
    expect(emailInput).toBeTruthy();
    expect(emailInput?.getAttribute('type')).toBe('email');
    expect(emailInput?.getAttribute('placeholder')).toBe('Enter your email');
  });

  it('should display password input field', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const passwordLabel = compiled.querySelector('label[for="password"]');
    const passwordInput = compiled.querySelector('#password');
    
    expect(passwordLabel).toBeTruthy();
    expect(passwordLabel?.textContent?.trim()).toBe('Password *');
    expect(passwordInput).toBeTruthy();
    expect(passwordInput?.getAttribute('type')).toBe('password');
    expect(passwordInput?.getAttribute('placeholder')).toBe('Enter your password');
  });

  it('should display form action buttons', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttons = compiled.querySelectorAll('.form-actions button');
    
    expect(buttons).toHaveLength(2);
    
    // Primary sign-in button
    const signInButton = buttons[0];
    expect(signInButton.textContent?.trim()).toBe('Sign In');
    expect(signInButton.getAttribute('type')).toBe('submit');
  expect(signInButton.className).toContain('btn');
  expect(signInButton.className).toContain('btn--primary');
    
    // Google sign-in button
    const googleButton = buttons[1];
    expect(googleButton.textContent?.trim()).toBe('Sign in with Google');
    expect(googleButton.getAttribute('type')).toBe('button');
  expect(googleButton.className).toContain('btn--secondary');
  });

  it('should display auth footer with registration link', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const footerText = compiled.querySelector('.auth-footer p');
    const registerLink = compiled.querySelector('.auth-footer a');
    
    expect(footerText?.textContent?.trim()).toBe('Don\'t have an account?');
    expect(registerLink?.textContent?.trim()).toBe('Create an account');
    // Check that the router link exists (RouterTestingModule will handle the routing)
    expect(registerLink).toBeTruthy();
  });

  it('should have proper form structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const formFields = compiled.querySelectorAll('.form-field');
    
    expect(formFields).toHaveLength(2);
    
    // Each form field should have a label and input
    formFields.forEach(group => {
      expect(group.querySelector('label')).toBeTruthy();
      expect(group.querySelector('input')).toBeTruthy();
    });
  });

  it('should apply correct CSS classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    expect(compiled.querySelector('.auth-page')).toBeTruthy();
    expect(compiled.querySelector('.auth-container')).toBeTruthy();
    expect(compiled.querySelector('.auth-header')).toBeTruthy();
  expect(compiled.querySelector('.crud-form')).toBeTruthy();
    expect(compiled.querySelector('.auth-footer')).toBeTruthy();
    
    // Form elements
  expect(compiled.querySelectorAll('.form-field')).toHaveLength(2);
  expect(compiled.querySelectorAll('.form-control')).toHaveLength(2);
    expect(compiled.querySelector('.form-actions')).toBeTruthy();
  });

  it('should have proper input attributes for accessibility', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const emailInput = compiled.querySelector('#email');
    const passwordInput = compiled.querySelector('#password');
    const emailLabel = compiled.querySelector('label[for="email"]');
    const passwordLabel = compiled.querySelector('label[for="password"]');
    
    // Inputs should have proper IDs and labels should reference them
    expect(emailInput?.getAttribute('id')).toBe('email');
    expect(passwordInput?.getAttribute('id')).toBe('password');
    expect(emailLabel?.getAttribute('for')).toBe('email');
    expect(passwordLabel?.getAttribute('for')).toBe('password');
    
    // Inputs should have appropriate types
    expect(emailInput?.getAttribute('type')).toBe('email');
    expect(passwordInput?.getAttribute('type')).toBe('password');
  });

  it('should have semantic HTML structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should have proper heading hierarchy
    expect(compiled.querySelector('h1')).toBeTruthy();
    
    // Should use form element
    expect(compiled.querySelector('form')).toBeTruthy();
    
    // Should have proper button types
    const submitButton = compiled.querySelector('button[type="submit"]');
    const normalButton = compiled.querySelector('button[type="button"]');
    expect(submitButton).toBeTruthy();
    expect(normalButton).toBeTruthy();
  });

  it('should be a presentation component without logic', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should have form elements but no complex interactions
    expect(compiled.querySelector('form')).toBeTruthy();
    expect(compiled.querySelectorAll('input')).toHaveLength(2);
    expect(compiled.querySelectorAll('button')).toHaveLength(2);
    
    // Should have navigation link in footer
    expect(compiled.querySelector('.auth-footer a')).toBeTruthy();
  });

  it('should have proper container hierarchy', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const authPage = compiled.querySelector('.auth-page');
    const authContainer = compiled.querySelector('.auth-container');
    const authHeader = compiled.querySelector('.auth-header');
  const authForm = compiled.querySelector('.crud-form');
    const authFooter = compiled.querySelector('.auth-footer');
    
    // Verify proper nesting
    expect(authPage?.contains(authContainer as Node)).toBe(true);
    expect(authContainer?.contains(authHeader as Node)).toBe(true);
    expect(authContainer?.contains(authForm as Node)).toBe(true);
    expect(authContainer?.contains(authFooter as Node)).toBe(true);
  });
});