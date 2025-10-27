import { Component, signal } from '@angular/core';
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

@Component({
  standalone: true,
  imports: [ButtonDirective],
  template: `
    <button appButton [variant]="variant()" [size]="size()">Dynamic</button>
  `
})
class DynamicTestComponent {
  variant = signal<'primary' | 'secondary' | 'ghost' | 'danger'>('primary');
  size = signal<'sm' | 'md' | 'lg'>('md');
}

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

  it('applies alias classes for variants', async () => {
    await render(TestHostComponent, { providers: [provideZonelessChangeDetection()] });
    const primary = screen.getByRole('button', { name: 'Primary' });
    expect(primary.className).toContain('btn-primary');
    
    const secondary = screen.getByRole('button', { name: 'Secondary' });
    expect(secondary.className).toContain('btn-secondary');
    
    const ghost = screen.getByText('Link Btn');
    expect(ghost.className).toContain('btn-ghost');
  });

  it('applies alias classes for sizes', async () => {
    await render(TestHostComponent, { providers: [provideZonelessChangeDetection()] });
    const primary = screen.getByRole('button', { name: 'Primary' });
    expect(primary.className).toContain('btn-medium');
    
    const secondary = screen.getByRole('button', { name: 'Secondary' });
    expect(secondary.className).toContain('btn-small');
    
    const ghost = screen.getByText('Link Btn');
    expect(ghost.className).toContain('btn-large');
  });

  it('removes previous variant classes when variant changes', async () => {
    const { fixture } = await render(DynamicTestComponent, {
      providers: [provideZonelessChangeDetection()]
    });
    
    const button = screen.getByRole('button', { name: 'Dynamic' });
    
    // Initial state
    expect(button.className).toContain('btn--primary');
    expect(button.className).toContain('btn-primary');
    
    // Change variant to secondary
    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();
    
    // Old classes removed, new classes added
    expect(button.className).not.toContain('btn--primary');
    expect(button.className).not.toContain('btn-primary');
    expect(button.className).toContain('btn--secondary');
    expect(button.className).toContain('btn-secondary');
    
    // Change variant to danger
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();
    
    expect(button.className).not.toContain('btn--secondary');
    expect(button.className).not.toContain('btn-secondary');
    expect(button.className).toContain('btn--danger');
    expect(button.className).toContain('btn-danger');
    
    // Change variant to ghost
    fixture.componentInstance.variant.set('ghost');
    fixture.detectChanges();
    
    expect(button.className).not.toContain('btn--danger');
    expect(button.className).not.toContain('btn-danger');
    expect(button.className).toContain('btn--ghost');
    expect(button.className).toContain('btn-ghost');
  });

  it('removes previous size classes when size changes', async () => {
    const { fixture } = await render(DynamicTestComponent, {
      providers: [provideZonelessChangeDetection()]
    });
    
    const button = screen.getByRole('button', { name: 'Dynamic' });
    
    // Initial state
    expect(button.className).toContain('btn--md');
    expect(button.className).toContain('btn-medium');
    
    // Change size to small
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    
    // Old classes removed, new classes added
    expect(button.className).not.toContain('btn--md');
    expect(button.className).not.toContain('btn-medium');
    expect(button.className).toContain('btn--sm');
    expect(button.className).toContain('btn-small');
    
    // Change size to large
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    
    expect(button.className).not.toContain('btn--sm');
    expect(button.className).not.toContain('btn-small');
    expect(button.className).toContain('btn--lg');
    expect(button.className).toContain('btn-large');
    
    // Change back to medium
    fixture.componentInstance.size.set('md');
    fixture.detectChanges();
    
    expect(button.className).not.toContain('btn--lg');
    expect(button.className).not.toContain('btn-large');
    expect(button.className).toContain('btn--md');
    expect(button.className).toContain('btn-medium');
  });

  it('removes both variant and size classes when both change simultaneously', async () => {
    const { fixture } = await render(DynamicTestComponent, {
      providers: [provideZonelessChangeDetection()]
    });
    
    const button = screen.getByRole('button', { name: 'Dynamic' });
    
    // Initial state
    expect(button.className).toContain('btn--primary');
    expect(button.className).toContain('btn-primary');
    expect(button.className).toContain('btn--md');
    expect(button.className).toContain('btn-medium');
    
    // Change both variant and size
    fixture.componentInstance.variant.set('danger');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    
    // Old classes removed
    expect(button.className).not.toContain('btn--primary');
    expect(button.className).not.toContain('btn-primary');
    expect(button.className).not.toContain('btn--md');
    expect(button.className).not.toContain('btn-medium');
    
    // New classes added
    expect(button.className).toContain('btn--danger');
    expect(button.className).toContain('btn-danger');
    expect(button.className).toContain('btn--lg');
    expect(button.className).toContain('btn-large');
  });

  it('maintains base btn class through all changes', async () => {
    const { fixture } = await render(DynamicTestComponent, {
      providers: [provideZonelessChangeDetection()]
    });
    
    const button = screen.getByRole('button', { name: 'Dynamic' });
    
    // Base class always present
    expect(button.classList.contains('btn')).toBe(true);
    
    fixture.componentInstance.variant.set('secondary');
    fixture.detectChanges();
    expect(button.classList.contains('btn')).toBe(true);
    
    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    expect(button.classList.contains('btn')).toBe(true);
    
    fixture.componentInstance.variant.set('ghost');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(button.classList.contains('btn')).toBe(true);
  });
});
