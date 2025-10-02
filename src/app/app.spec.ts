import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { App } from './app';
import { TranslationService } from './core/services/translation.service';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './shared/components/header/header.component';
import { Component as NgComponent } from '@angular/core';

@NgComponent({
  selector: 'app-language-switcher',
  standalone: true,
  template: '<!-- stub language switcher -->'
})
class StubLanguageSwitcherComponent {}
import { LOCAL_STORAGE } from './core/tokens/local.storage.token';
import { WINDOW_DOCUMENT } from './core/tokens/document.token';

// Mock component for routing
@Component({
  selector: 'app-mock',
  template: '<div>Mock Component</div>',
  standalone: true
})
class MockComponent {}

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock document
const mockDocument = {
  documentElement: {
    classList: {
      toggle: jest.fn(),
      contains: jest.fn(),
    }
  }
};

describe('App', () => {
  beforeEach(async () => {
    // Clear mocks
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: '', component: MockComponent },
          { path: 'dashboard', component: MockComponent },
          { path: 'auth/login', component: MockComponent },
          { path: 'settings', component: MockComponent }
        ]),
        {
          provide: LOCAL_STORAGE,
          useValue: mockLocalStorage
        },
        {
          provide: WINDOW_DOCUMENT,
          useValue: mockDocument
        },
        {
          provide: TranslationService,
          useValue: {
            currentLang: () => 'en',
            use: () => {},
            availableLangs: ['en','es','pt','ca','gl'],
            instant: (key: string) => {
              const dict: Record<string,string> = {
                'app.title': 'Angular Architecture',
                'app.navigation.dashboard': 'Dashboard',
                'app.navigation.clothes': 'Clothes',
                'app.navigation.auth': 'Authentication',
                'app.navigation.themeDemo': 'Theme Demo',
                'app.navigation.settings': 'Settings',
                'app.actions.toggleTheme': 'Switch to {{theme}} theme',
                'app.actions.openMenu': 'Open menu',
                'app.actions.closeMenu': 'Close menu'
              };
              return dict[key] ?? key;
            }
          }
        }
      ]
    }).compileComponents();

    // Override HeaderComponent to swap out language switcher
    TestBed.overrideComponent(HeaderComponent, {
      set: {
        imports: [CommonModule, RouterLink, RouterLinkActive, StubLanguageSwitcherComponent]
      }
    });
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Angular Architecture');
  });

  it('should render header component', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).toBeTruthy();
  });

  it('should render router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });
});
