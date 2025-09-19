# AngularArchitecture

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

# Angular 20 Architecture Blueprint Implementation

This project demonstrates the implementation of Angular 20 Architecture Blueprint for Real Teams, featuring modern practices and best patterns.

## 🏗️ Architecture Overview

### ✅ Implemented Features

1. **Standalone APIs First**
   - All components use standalone: true
   - No NgModules used
   - Clean provider configuration in `app.config.ts`

2. **Signals-First Approach**
   - Header component uses signals for reactive state
   - Theme toggle with signal-based state management
   - Navigation links managed through signals

3. **Domain-Driven Folder Structure**
   ```
   src/app/
   ├── core/          # Singleton services, guards
   ├── shared/        # UI components, directives, pipes
   │   └── components/
   │       └── header/
   └── features/      # Feature modules
       ├── auth/
       ├── dashboard/
       └── settings/
   ```

4. **Modern Routing with Lazy Loading**
   - Standalone components with lazy loading
   - Feature-based route organization
   - Clean route definitions

5. **Modern Testing Stack**
   - Comprehensive test suite for header component
   - Jasmine/Karma configuration
   - Accessibility and responsiveness testing

## 🧩 Components

### Header Component (`shared/components/header`)

A fully-featured navigation header with:

- **Signal-based Navigation Links**: Dynamic navigation menu using Angular signals
- **Theme Toggle**: Dark/light theme switching with localStorage persistence
- **Responsive Design**: Mobile-friendly responsive layout
- **Accessibility**: Full ARIA support and keyboard navigation
- **Type Safety**: Full TypeScript support with interfaces

#### Features:
- 🔗 Dynamic navigation links with icons
- 🌓 Theme switching (light/dark) with persistence
- 📱 Responsive design for mobile and desktop
- ♿ Full accessibility support
- 🧪 Comprehensive test coverage

#### Usage:
```typescript
// The header is automatically included in the main app
// Navigation links are configurable through signals
const links = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Settings', path: '/settings', icon: '⚙️' }
];
```

## 🧪 Testing

The project includes comprehensive tests for the header component covering:

- Component initialization and rendering
- Navigation link functionality
- Theme toggle behavior
- Accessibility compliance
- Responsive design
- Signal-based state management
- localStorage integration

### Running Tests

```bash
npm test
```

## 🚀 Development Server

```bash
npm start
```

Navigate to `http://localhost:4200/`

## 📝 Key Architecture Principles Implemented

1. **Single Responsibility Principle**: Each component and service has a single, well-defined responsibility
2. **Presentational vs Smart Components**: Header is a presentational component with minimal logic
3. **Separation of Concerns**: UI, state, and routing logic are properly separated
4. **Signal-First Reactivity**: Using Angular signals for reactive state management
5. **Modern Testing**: Comprehensive test coverage with modern testing practices

## 🔄 Future Enhancements

- [ ] Add more feature modules (auth, settings)
- [ ] Implement signal-based state management service
- [ ] Add component library with more shared components
- [ ] Implement SSR optimizations
- [ ] Add E2E tests with Playwright

## 📚 Architecture Decisions

### Why Signals?
- Better performance than RxJS for UI state
- Simpler mental model for component state
- Future-proof with Angular's direction

### Why Domain-Driven Structure?
- Better scalability for large teams
- Clear ownership boundaries
- Easier to maintain and test

### Why Standalone Components?
- Smaller bundle sizes
- Better tree-shaking
- Simpler dependency injection
- Future-proof with Angular 20+

This implementation showcases modern Angular development practices while maintaining simplicity and performance.