# Styling Agent

Use CSS custom properties for all colors, spacing, borders, shadows. BEM naming. Mobile-first responsive. WCAG AA contrast ≥4.5:1. 4 themes: light/dark + warm variants. ThemeService for dynamic switching.

## Quick Reference

**CSS variables**: src/app/themes/_variables.scss (colors, spacing, radius, shadows)
**BEM**: `.block__element--modifier`
**Pattern**: Use `var(--primary-600)`, `var(--bg-primary)`, `var(--spacing-md)`, `var(--radius-md)`, `var(--shadow-sm)`
**Responsive**: Mobile-first, use container-width breakpoints
**Contrast**: Test with browser tools, aim for 4.5:1 minimum
**Theme switching**: ThemeService handles CSS custom property swaps, no JS style changes

    &:active:not(:disabled) {
      background-color: var(--primary-800);
    }
  }

  &--secondary {
    background-color: var(--secondary-200);
    color: var(--text-primary);

    &:hover:not(:disabled) {
      background-color: var(--secondary-300);
    }
  }

  &--ghost {
    background-color: transparent;
    color: var(--text-accent);

    &:hover:not(:disabled) {
      background-color: var(--bg-accent);
    }
  }

  &--danger {
    background-color: var(--color-error);
    color: var(--text-inverse);

    &:hover:not(:disabled) {
      filter: brightness(0.9);
    }
  }

  // Sizes
  &--sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.8125rem;
  }

  &--lg {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
  }
}
```

## Responsive Design

### Breakpoints
```scss
// Mobile first approach
$breakpoint-sm: 640px;   // Small tablets
$breakpoint-md: 768px;   // Tablets
$breakpoint-lg: 1024px;  // Desktops
$breakpoint-xl: 1280px;  // Large desktops

.responsive-component {
  // Mobile styles (default)
  display: block;
  padding: var(--spacing-sm);

  // Tablets and up
  @media (min-width: #{$breakpoint-md}) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
  }

  // Desktops and up
  @media (min-width: #{$breakpoint-lg}) {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-xl);
    padding: var(--spacing-xl);
  }
}
```

### Responsive Utilities

```scss
// Flexbox utilities
.flex {
  display: flex;

  &--column { flex-direction: column; }
  &--row { flex-direction: row; }
  &--wrap { flex-wrap: wrap; }
  &--center { 
    align-items: center; 
    justify-content: center; 
  }
  &--between { justify-content: space-between; }
  &--gap-sm { gap: var(--spacing-sm); }
  &--gap-md { gap: var(--spacing-md); }
  &--gap-lg { gap: var(--spacing-lg); }
}

// Grid utilities
.grid {
  display: grid;

  &--cols-2 { grid-template-columns: repeat(2, 1fr); }
  &--cols-3 { grid-template-columns: repeat(3, 1fr); }
  &--cols-4 { grid-template-columns: repeat(4, 1fr); }
  &--gap-md { gap: var(--spacing-md); }

  // Responsive columns
  &--responsive {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}
```

## Accessibility Styling

### Focus Indicators

```scss
// Global focus styles
:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}

// Component-specific focus
.interactive-element {
  &:focus-visible {
    outline-color: var(--primary-600);
    outline-width: 2px;
    outline-style: solid;
    outline-offset: 2px;
  }
}

// Dark theme adjustments
[data-theme="dark"],
[data-theme="dark2"] {
  :focus-visible {
    outline-color: var(--primary-400);
  }
}
```

### High Contrast Mode

```scss
@media (prefers-contrast: high) {
  .my-component {
    border-width: 2px;
    border-color: currentColor;
  }

  button {
    font-weight: 600;
    border: 2px solid currentColor;
  }
}
```

### Color Contrast

Always maintain WCAG AA ratios (4.5:1 for normal text, 3:1 for large text):

```scss
// ✅ CORRECT - Good contrast
.text-on-light {
  background: var(--bg-primary);    // White-ish
  color: var(--text-primary);       // Dark (>4.5:1)
}

.text-on-dark {
  background: var(--primary-900);   // Very dark
  color: var(--text-inverse);       // White (>4.5:1)
}

// ❌ WRONG - Poor contrast
.bad-contrast {
  background: #f0f0f0;  // Light gray
  color: #ccc;          // Light gray (<3:1) ❌
}
```

## Modal Styling

Modals support data attributes for theming:

```scss
// _modal.scss
.app-modal-panel {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  padding: var(--spacing-xl);
  max-width: 500px;
  width: 90vw;

  // Size variants
  &[data-size="sm"] {
    max-width: 400px;
    padding: var(--spacing-lg);
  }

  &[data-size="md"] {
    max-width: 600px;
  }

  &[data-size="lg"] {
    max-width: 800px;
  }

  &[data-size="xl"] {
    max-width: 1000px;
  }

  // Tone variants (accent bar)
  &[data-tone="warning"] {
    border-top: 4px solid var(--color-warning);
  }

  &[data-tone="error"] {
    border-top: 4px solid var(--color-error);
  }

  &[data-tone="success"] {
    border-top: 4px solid var(--color-success);
  }

  &[data-tone="info"] {
    border-top: 4px solid var(--color-info);
  }
}

.app-modal-backdrop {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}
```

## AG Grid Theming

```scss
.ag-theme-custom {
  // Use CSS custom properties
  --ag-background-color: var(--bg-primary);
  --ag-foreground-color: var(--text-primary);
  --ag-border-color: var(--border-primary);
  --ag-header-background-color: var(--bg-secondary);
  --ag-header-foreground-color: var(--text-primary);
  --ag-odd-row-background-color: var(--bg-secondary);
  --ag-row-hover-color: var(--bg-accent);
  --ag-selected-row-background-color: var(--primary-100);
  --ag-font-size: 0.875rem;
  --ag-row-height: 48px;
  --ag-header-height: 56px;
}
```

## Animations and Transitions

```scss
.animated-element {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

// Respect reduced motion preference
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

## Theme Service Integration

```typescript
// In component
import { ThemeService } from '../core/services/theme.service';

export class MyComponent {
  private readonly themeService = inject(ThemeService);

  readonly currentTheme = this.themeService.currentTheme;
  readonly isDarkMode = this.themeService.isDarkMode;

  switchTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    const newTheme = current === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(newTheme);
  }
}
```

## Performance Best Practices

### Avoid Deep Nesting

```scss
// ❌ WRONG - Too nested (>3 levels)
.parent {
  .child {
    .grandchild {
      .great-grandchild {
        color: red;
      }
    }
  }
}

// ✅ CORRECT - Flat BEM structure
.parent { }
.parent__child { }
.parent__grandchild { }
.parent__grandchild--special { }
```

### Use CSS Variables for Dynamic Values

```scss
// ❌ WRONG - Hardcoded
.header {
  height: 64px;
  background: #3b82f6;
}

// ✅ CORRECT - CSS variables
:root {
  --header-height: 64px;
}

.header {
  height: var(--header-height);
  background: var(--primary-600);
}
```

### Minimize !important

```scss
// ❌ WRONG
.element {
  color: blue !important;
}

// ✅ CORRECT - Increase specificity
.component .element {
  color: var(--primary-600);
}

// Or use modifier
.element--special {
  color: var(--primary-600);
}
```

## Common Styling Patterns

### Card Component

```scss
.card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: var(--shadow-md);
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-md);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-secondary);
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  &__body {
    color: var(--text-secondary);
    line-height: 1.6;
  }

  &--highlighted {
    border-color: var(--primary-600);
    background: var(--bg-accent);
  }
}
```

### Form Elements

```scss
.form-field {
  margin-bottom: var(--spacing-lg);

  &__label {
    display: block;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: var(--spacing-xs);
  }

  &__input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--border-primary);
    border-radius: var(--radius-md);
    background: var(--bg-primary);
    color: var(--text-primary);
    font-size: 0.875rem;
    transition: border-color 0.2s ease;

    &:focus {
      outline: none;
      border-color: var(--primary-600);
      box-shadow: 0 0 0 3px var(--primary-100);
    }

    &:disabled {
      background: var(--bg-muted);
      cursor: not-allowed;
      opacity: 0.6;
    }

    &--error {
      border-color: var(--color-error);

      &:focus {
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
      }
    }
  }

  &__error {
    display: block;
    margin-top: var(--spacing-xs);
    color: var(--color-error);
    font-size: 0.8125rem;
  }
}
```

## Styling Checklist

Before committing styles:
- [ ] Uses CSS custom properties (no hardcoded colors)
- [ ] Follows BEM naming convention
- [ ] WCAG AA contrast ratios maintained
- [ ] Mobile-first responsive design
- [ ] Focus indicators for interactive elements
- [ ] Tested in all 4 themes (light, dark, light2, dark2)
- [ ] Respects `prefers-reduced-motion`
- [ ] No deep nesting (max 3 levels)
- [ ] No !important unless absolutely necessary
- [ ] Proper spacing using CSS variables

## Quick Reference

```scss
// Color pattern
background: var(--bg-primary);
color: var(--text-primary);
border: 1px solid var(--border-primary);

// Spacing pattern
padding: var(--spacing-md);
gap: var(--spacing-sm);
margin-bottom: var(--spacing-lg);

// Border radius
border-radius: var(--radius-md);

// Shadow
box-shadow: var(--shadow-sm);

// Responsive
@media (min-width: 768px) {
  // Tablet+
}

// Focus
&:focus-visible {
  outline: 2px solid var(--primary-600);
  outline-offset: 2px;
}

// Transition
transition: all 0.2s ease;
```
