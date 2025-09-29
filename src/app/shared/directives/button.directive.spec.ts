import { Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { provideZonelessChangeDetection } from '@angular/core';
import { ButtonDirective } from './button.directive';

@Component({
  standalone: true,
  imports: [ButtonDirective],
  template: `
    <button appButton variant="primary" size="md">Primary</button>
    <button appButton variant="secondary" size="sm">Secondary</button>
    <a appButton variant="ghost" size="lg">Link Btn</a>
  `
})
class TestHostComponent {}

describe('ButtonDirective', () => {
  it('applies base and variant classes', async () => {
  await render(TestHostComponent, { providers: [provideZonelessChangeDetection()] });
    const primary = screen.getByRole('button', { name: 'Primary' });
    expect(primary.classList.contains('btn')).toBe(true);
    expect(primary.className).toContain('btn--primary');
    expect(primary.className).toContain('btn--md');
  });

  it('applies size + variant for secondary small', async () => {
  await render(TestHostComponent, { providers: [provideZonelessChangeDetection()] });
    const secondary = screen.getByRole('button', { name: 'Secondary' });
    expect(secondary.className).toContain('btn--secondary');
    expect(secondary.className).toContain('btn--sm');
  });

  it('works on anchor elements', async () => {
  await render(TestHostComponent, { providers: [provideZonelessChangeDetection()] });
    const link = screen.getByText('Link Btn');
    expect(link.tagName).toBe('A');
    expect(link.className).toContain('btn--ghost');
    expect(link.className).toContain('btn--lg');
  });
});
