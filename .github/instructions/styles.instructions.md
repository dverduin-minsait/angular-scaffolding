# Styles Instructions

**SCSS** + **CSS custom properties**. 4 themes: light/dark + warm variants. **BEM naming**. Mobile-first. **WCAG AA contrast ≥4.5:1**.

## CSS Variables

`src/app/themes/_variables.scss`: colors (--primary-50 to 950, --bg-primary/secondary, --text-primary, --border-*, --color-success/warning/error, --shadow-*), spacing (--spacing-xs to 2xl), radius (--radius-sm to full)

## Usage

```scss
// ✅ Use CSS custom properties
background: var(--bg-primary);
color: var(--text-primary);
padding: var(--spacing-md);
border-radius: var(--radius-md);

// ❌ Don't hardcode colors
background: #ffffff;
```

## Themes

4 themes in `src/app/themes/`: light (blue), dark (blue), light2 (warm), dark2 (warm). ThemeService swaps CSS custom properties at runtime.
--color-error
--color-info

// Shadows
--shadow-sm
--shadow-md
--shadow-lg
--shadow-xl
```

#### Spacing

```scss
--spacing-xs   // 0.25rem (4px)
--spacing-sm   // 0.5rem (8px)
--spacing-md   // 1rem (16px)
--spacing-lg   // 1.5rem (24px)
--spacing-xl   // 2rem (32px)
--spacing-2xl  // 3rem (48px)
```

#### Border Radius

```scss
--radius-sm    // 0.25rem
--radius-md    // 0.375rem
--radius-lg    // 0.5rem
--radius-xl    // 0.75rem
--radius-full  // 9999px
```

## Component Styling Pattern

### File Structure

Each component should have its own SCSS file:

```
my-component/
├── my-component.component.ts
├── my-component.component.html
├── my-component.component.scss    ← Component styles
└── my-component.component.spec.ts
```

### Component SCSS Template

```scss
// my-component.component.scss
.my-component {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background-color: var(--bg-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--border-primary);
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  &__content {
    color: var(--text-secondary);
    line-height: 1.6;
  }

  &__actions {
    display: flex;
    gap: var(--spacing-sm);
    justify-content: flex-end;
  }
}
```

### BEM Methodology

Use BEM (Block Element Modifier) naming:

```scss
// Block
.card { }

// Element (child of block)
.card__header { }
.card__body { }
.card__footer { }

// Modifier (variant of block or element)
.card--featured { }
.card--large { }
.card__header--sticky { }
```

## Button Directive Styling

The project uses a `ButtonDirective` for consistent button styling:

```typescript
// In template
<button appButton variant="primary" size="md">Save</button>
<button appButton variant="secondary" size="sm">Cancel</button>
<button appButton variant="danger" size="lg">Delete</button>
<button appButton variant="ghost">Link Action</button>
```

### Button Classes Applied

The directive applies these classes:
- Base: `.btn`
- Variants: `.btn--primary`, `.btn--secondary`, `.btn--ghost`, `.btn--danger`
- Sizes: `.btn--sm`, `.btn--md`, `.btn--lg`

### Button Styling Example

```scss
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &--primary {
    background-color: var(--primary-600);
    color: var(--text-inverse);
    
    &:hover:not(:disabled) {
      background-color: var(--primary-700);
    }
  }
  
  &--secondary {
    background-color: var(--secondary-200);
    color: var(--text-primary);
    
    &:hover:not(:disabled) {
      background-color: var(--secondary-300);
    }
  }
  
  &--sm {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.875rem;
  }
  
  &--lg {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1.125rem;
  }
}
```

## Responsive Design

### Breakpoints

```scss
// Mobile first approach
@media (min-width: 640px) {  // sm
  // Tablet styles
}

@media (min-width: 768px) {  // md
  // Small desktop styles
}

@media (min-width: 1024px) { // lg
  // Desktop styles
}

@media (min-width: 1280px) { // xl
  // Large desktop styles
}
```

### Responsive Pattern

```scss
.my-component {
  display: block;
  padding: var(--spacing-sm);
  
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
    padding: var(--spacing-lg);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    padding: var(--spacing-xl);
  }
}
```

## Theme Service Integration

Use `ThemeService` to programmatically control themes:

```typescript
import { ThemeService } from '../core/services/theme.service';

export class MyComponent {
  private readonly themeService = inject(ThemeService);
  
  // Read current theme
  readonly currentTheme = this.themeService.currentTheme;
  readonly isDarkMode = this.themeService.isDarkMode;
  
  // Switch theme
  switchTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}
```

## Modal Styling

Modals use specific data attributes for styling:

```typescript
// Open modal with size and tone
modalService.open(MyDialogComponent, {
  size: 'md',        // 'sm' | 'md' | 'lg' | 'xl'
  tone: 'warning',   // 'warning' | 'error' | 'success' | 'info'
  ariaLabel: 'Confirmation dialog'
});
```

Modal SCSS handles these attributes:

```scss
.app-modal-panel {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  
  &[data-size="sm"] {
    max-width: 400px;
  }
  
  &[data-size="lg"] {
    max-width: 700px;
  }
  
  &[data-size="xl"] {
    max-width: 900px;
  }
  
  &[data-tone="warning"] {
    border-top: 4px solid var(--color-warning);
  }
  
  &[data-tone="error"] {
    border-top: 4px solid var(--color-error);
  }
}
```

## Accessibility Styling

### Focus Indicators

Always provide visible focus indicators:

```scss
button, a, input, select, textarea {
  &:focus-visible {
    outline: 2px solid var(--primary-600);
    outline-offset: 2px;
  }
}

// For dark themes, adjust contrast
[data-theme="dark"] {
  button:focus-visible {
    outline-color: var(--primary-400);
  }
}
```

### High Contrast Support

```scss
@media (prefers-contrast: high) {
  .my-component {
    border-width: 2px;
  }
  
  button {
    font-weight: 600;
  }
}
```

### Color Contrast

Always ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text):

```scss
// ✅ CORRECT - Good contrast
.text-on-background {
  background: var(--bg-primary);      // White or near-white
  color: var(--text-primary);         // Dark gray/black (contrast > 4.5:1)
}

// ❌ WRONG - Poor contrast
.bad-contrast {
  background: #f0f0f0;  // Light gray
  color: #ccc;          // Light gray text (contrast < 3:1)
}
```

## Grid and Layout Utilities

### Flexbox Utilities

```scss
.flex {
  display: flex;
  
  &--column { flex-direction: column; }
  &--wrap { flex-wrap: wrap; }
  &--center { align-items: center; justify-content: center; }
  &--between { justify-content: space-between; }
  &--gap-sm { gap: var(--spacing-sm); }
  &--gap-md { gap: var(--spacing-md); }
  &--gap-lg { gap: var(--spacing-lg); }
}
```

### Grid Utilities

```scss
.grid {
  display: grid;
  
  &--cols-2 { grid-template-columns: repeat(2, 1fr); }
  &--cols-3 { grid-template-columns: repeat(3, 1fr); }
  &--cols-4 { grid-template-columns: repeat(4, 1fr); }
  &--gap-md { gap: var(--spacing-md); }
}
```

## AG Grid Theming

The project uses AG Grid with custom theming:

```scss
// AG Grid integration with custom properties
.ag-theme-custom {
  --ag-background-color: var(--bg-primary);
  --ag-foreground-color: var(--text-primary);
  --ag-border-color: var(--border-primary);
  --ag-header-background-color: var(--bg-secondary);
  --ag-odd-row-background-color: var(--bg-secondary);
  --ag-row-hover-color: var(--bg-accent);
  --ag-selected-row-background-color: var(--primary-100);
}
```

## Performance Best Practices

### Avoid Deep Nesting

```scss
// ✅ CORRECT - Flat structure
.card { }
.card__header { }
.card__title { }

// ❌ WRONG - Too nested
.card {
  .card__header {
    .card__title {
      span { }
    }
  }
}
```

### Use CSS Custom Properties for Dynamic Values

```scss
// ✅ CORRECT - Theme-aware
.dynamic-height {
  height: var(--header-height, 64px);
}

// ❌ WRONG - Hardcoded
.dynamic-height {
  height: 64px;
}
```

### Avoid !important

```scss
// ✅ CORRECT - Use specificity
.btn.btn--primary {
  background: var(--primary-600);
}

// ❌ WRONG - Using !important
.btn {
  background: var(--primary-600) !important;
}
```

## Animation and Transitions

Use consistent transition timing:

```scss
.element {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
  }
}

// Respect user preferences
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## DO ✅

- Use CSS custom properties (variables) for all colors and spacing
- Follow BEM naming convention
- Ensure WCAG AA contrast ratios (4.5:1+)
- Use mobile-first responsive design
- Provide focus indicators for all interactive elements
- Use semantic color variables (--text-primary, not --gray-900)
- Test all themes (light, dark, light2, dark2)
- Respect `prefers-reduced-motion`
- Use `ThemeService` for programmatic theme switching

## DON'T ❌

- Hardcode color values (#ffffff, rgb(), etc.)
- Use inline styles in templates
- Nest SCSS more than 3 levels deep
- Use !important unless absolutely necessary
- Forget to test dark theme variants
- Ignore accessibility (contrast, focus states)
- Use fixed pixel values for responsive layouts
- Style based on internal classes (use custom properties)
