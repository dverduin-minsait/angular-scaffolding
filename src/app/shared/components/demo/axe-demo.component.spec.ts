import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { axe } from 'vitest-axe';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-axe-demo',
  standalone: true,
  template: `
    <div>
      <h1>Accessibility Demo</h1>
      <button type="button" aria-label="Accessible button">
        Click me
      </button>
      <form>
        <label for="email">Email</label>
        <input id="email" type="email" required />
        <button type="submit">Submit</button>
      </form>
    </div>
  `
})
class AxeDemoComponent {}

describe('AxeDemoComponent - Accessibility', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AxeDemoComponent,
        TranslateModule.forRoot()
      ]
    }).compileComponents();
  });

  // Example 1: Using vitest-axe directly
  it('should have no accessibility violations (vitest-axe)', async () => {
    const { container } = await render(AxeDemoComponent);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Example 2: Using axe with default WCAG AA checks
  it('should meet WCAG AA standards', async () => {
    const { container } = await render(AxeDemoComponent);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Example 3: Using axe with custom rules
  it('should meet custom accessibility standards', async () => {
    const { container } = await render(AxeDemoComponent);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true },
        'button-name': { enabled: true }
      }
    });
    expect(results).toHaveNoViolations();
  });

  // Example 4: Testing specific elements
  it('should have accessible button', async () => {
    await render(AxeDemoComponent);
    const button = screen.getByRole('button', { name: /accessible button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
  });

  // Example 5: Testing form accessibility
  it('should have accessible form', async () => {
    await render(AxeDemoComponent);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('id');
    expect(submitButton).toBeInTheDocument();
  });
});