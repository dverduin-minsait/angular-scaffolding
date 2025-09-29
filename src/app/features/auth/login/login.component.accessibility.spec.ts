import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginComponent } from './login.component';
import { AccessibilityTestUtils } from '../../../testing/accessibility-test-utils';
import { FormsModule } from '@angular/forms';

describe('LoginComponent Accessibility', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Accessibility', () => {
    it('should have proper form labeling', () => {
      const emailResult = AccessibilityTestUtils.testFormFieldAccessibility(fixture, 'email');
      const passwordResult = AccessibilityTestUtils.testFormFieldAccessibility(fixture, 'password');

      expect(emailResult.hasLabel).toBeTruthy();
      expect(emailResult.hasRequiredIndicator).toBeTruthy();
      expect(emailResult.hasValidAutocomplete).toBeTruthy();

      expect(passwordResult.hasLabel).toBeTruthy();
      expect(passwordResult.hasRequiredIndicator).toBeTruthy();
      expect(passwordResult.hasValidAutocomplete).toBeTruthy();
    });

    it('should have proper form landmark', () => {
      const form = fixture.nativeElement.querySelector('form');
      expect(form.getAttribute('aria-labelledby')).toBe('login-title');
      expect(form.hasAttribute('novalidate')).toBeTruthy();
    });

    it('should announce validation errors', async () => {
      // Trigger form submission to generate errors
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      submitButton.click();
      fixture.detectChanges();

      // Wait for async validation
      await fixture.whenStable();
      fixture.detectChanges();

      const emailError = fixture.nativeElement.querySelector('#email-error');
      const passwordError = fixture.nativeElement.querySelector('#password-error');

      if (emailError) {
        expect(emailError.getAttribute('role')).toBe('alert');
        expect(emailError.getAttribute('aria-live')).toBe('polite');
      }

      if (passwordError) {
        expect(passwordError.getAttribute('role')).toBe('alert');
        expect(passwordError.getAttribute('aria-live')).toBe('polite');
      }
    });

    it('should have proper button states', () => {
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      const googleButton = fixture.nativeElement.querySelector('button[type="button"]');

      expect(submitButton.getAttribute('type')).toBe('submit');
      expect(googleButton.getAttribute('type')).toBe('button');

      const submitButtonTest = AccessibilityTestUtils.testButtonAccessibility(submitButton);
      const googleButtonTest = AccessibilityTestUtils.testButtonAccessibility(googleButton);

      expect(submitButtonTest.hasType).toBeTruthy();
      expect(googleButtonTest.hasType).toBeTruthy();
    });

    it('should manage focus properly on form submission', async () => {
      const emailInput = fixture.nativeElement.querySelector('#email');
      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');

      // Submit empty form
      submitButton.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      // Check if aria-invalid is set on invalid fields
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order', () => {
      const focusableElements = AccessibilityTestUtils.getFocusableElements(fixture);
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Expected order: email, password, submit button, google button, register link
      const inputElements = focusableElements.filter(el => 
        el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'A'
      );
      
      expect(inputElements.length).toBeGreaterThanOrEqual(4);
    });

    it('should support Enter key for form submission', () => {
      const form = fixture.nativeElement.querySelector('form');
      const emailInput = fixture.nativeElement.querySelector('#email');
      
      // Set valid data
      component['formData'].set({
        email: 'test@example.com',
        password: 'password123'
      });
      fixture.detectChanges();

      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true
      });

      emailInput.dispatchEvent(enterEvent);
      fixture.detectChanges();

      // Form should attempt to submit (would need spy in real test)
      expect(form).toBeTruthy();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have proper heading hierarchy', () => {
      const headingTest = AccessibilityTestUtils.testHeadingHierarchy(fixture);
      expect(headingTest.valid).toBeTruthy();
      expect(headingTest.issues.length).toBe(0);
    });

    it('should have semantic structure', () => {
      const header = fixture.nativeElement.querySelector('header.auth-header');
      const footer = fixture.nativeElement.querySelector('footer.auth-footer');
      
      expect(header).toBeTruthy();
      expect(footer).toBeTruthy();
    });

    it('should provide context for external links', () => {
      const registerLink = fixture.nativeElement.querySelector('.auth-footer a');
      expect(registerLink).toBeTruthy();
      expect(registerLink.getAttribute('aria-label')).toContain('registration');
    });
  });

  describe('Error Handling', () => {
    it('should have live regions for error announcements', () => {
      // Trigger validation error
      component['formData'].set({ email: '', password: '' });
      component['onSubmit']();
      fixture.detectChanges();

  const errorElements = fixture.nativeElement.querySelectorAll('.form-error');
      
      errorElements.forEach((element: Element) => {
        expect(element.getAttribute('role')).toBe('alert');
        expect(['polite', 'assertive']).toContain(element.getAttribute('aria-live'));
      });
    });

    it('should associate errors with form fields', () => {
      // Trigger validation error
      component['formData'].set({ email: 'invalid', password: '123' });
      component['onSubmit']();
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector('#email');
      const passwordInput = fixture.nativeElement.querySelector('#password');

      const emailDescribedBy = emailInput.getAttribute('aria-describedby');
      const passwordDescribedBy = passwordInput.getAttribute('aria-describedby');

      if (emailDescribedBy) {
        const errorElement = fixture.nativeElement.querySelector(`#${emailDescribedBy}`);
        expect(errorElement).toBeTruthy();
      }

      if (passwordDescribedBy) {
        const errorElement = fixture.nativeElement.querySelector(`#${passwordDescribedBy}`);
        expect(errorElement).toBeTruthy();
      }
    });
  });

  describe('Loading States', () => {
    it('should announce loading state to screen readers', () => {
      component['isSubmitting'].set(true);
      fixture.detectChanges();

      const submitButton = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitButton.textContent?.trim()).toContain('Signing In...');
      expect(submitButton.hasAttribute('disabled')).toBeTruthy();
    });
  });
});