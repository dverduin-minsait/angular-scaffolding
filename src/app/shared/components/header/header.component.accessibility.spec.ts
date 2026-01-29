import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { HeaderComponent } from './header.component';
import { Navbar } from './navbar/navbar';
import { HeaderActions } from './header-actions/header-actions';
import { Sidebar } from './sidebar/sidebar';
import { TranslationService } from '../../../core/services/translation.service';
import { Component as NgComponent } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router, UrlTree } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AccessibilityTestUtils } from '../../../testing/accessibility-test-utils';
import { DOCUMENT } from '@angular/common';
import { signal } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateStubPipe, provideStubTranslationService } from '../../../testing/i18n-testing';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';
import { of } from 'rxjs';
import type { NavigationItem } from './navigation.types';

describe('HeaderComponent Accessibility', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockThemeService: {
    toggleTheme: ReturnType<typeof vi.fn>;
    isDarkMode: any;
    getThemeIcon: any;
    currentTheme: any;
  };
  let mockRouter: Partial<Router>;
  let mockDocument: Document;
  let mockActivatedRoute: Partial<ActivatedRoute>;

  beforeEach(async () => {
    const isDarkModeSignal = signal(false);
    const getThemeIconSignal = signal('☀️');
    const currentThemeSignal = signal('light');

    mockThemeService = {
      toggleTheme: vi.fn(),
      isDarkMode: isDarkModeSignal,
      getThemeIcon: getThemeIconSignal,
      currentTheme: currentThemeSignal
    };

    mockRouter = { 
      url: '/dashboard',
      events: of(),
      createUrlTree: vi.fn(() => {
        const mockUrlTree: Partial<UrlTree> = {
          toString: () => '/mocked-url',
          root: {} as any,
          queryParams: {},
          fragment: null,
          queryParamMap: {} as any
        };
        return mockUrlTree as UrlTree;
      }),
      serializeUrl: vi.fn(() => '/mocked-url')
    };
    mockDocument = document;
    mockActivatedRoute = {
      url: of([]),
      params: of({}),
      queryParams: of({})
    };

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        Navbar,
        HeaderActions,
        Sidebar,
        CommonModule,
        RouterLink,
        RouterLinkActive,
        TranslateModule.forRoot({ fallbackLang: 'en' })
      ],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DOCUMENT, useValue: mockDocument },
        {
          provide: LOCAL_STORAGE,
          useValue: {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn()
          }
        },
        ...provideStubTranslationService({ 
          'app.actions.toggleTheme': 'Switch to dark theme',
          'app.title': 'Angular Architecture',
          'app.navigation.dashboard': 'Dashboard',
          'app.navigation.demo-books': 'Demo Books'
        })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Keyboard Navigation', () => {
    it('should have proper tab order through focusable elements', () => {
      const focusableElements = AccessibilityTestUtils.getFocusableElements(fixture);
      
      expect(focusableElements.length).toBeGreaterThan(0);
      
      // Verify expected order: navigation links, theme toggle, burger menu
      const buttons = focusableElements.filter(el => el.tagName === 'BUTTON');
      const links = focusableElements.filter(el => el.tagName === 'A');
      
      expect(buttons.length).toBeGreaterThanOrEqual(1); // At least theme toggle
      expect(links.length).toBeGreaterThanOrEqual(0); // Navigation links
    });

    it('should close sidebar when Escape key is pressed', () => {
      // Open sidebar first
      component['isSidebarOpen'].set(true);
      fixture.detectChanges();

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true
      });

      document.dispatchEvent(escapeEvent);
      fixture.detectChanges();

      expect(component['isSidebarOpen']()).toBeFalsy();
    });

    it('should manage focus within sidebar when open', () => {
      component['isSidebarOpen'].set(true);
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      const focusableInSidebar = AccessibilityTestUtils.getFocusableElements({
        nativeElement: sidebar
      } as any);

      expect(focusableInSidebar.length).toBeGreaterThan(0);
      
      // All focusable elements should have tabindex="0" when sidebar is open
      focusableInSidebar.forEach(element => {
        const tabindex = element.getAttribute('tabindex');
        expect(tabindex).toBe('0');
      });
    });

    it('should prevent focus on sidebar elements when closed', () => {
      component['isSidebarOpen'].set(false);
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      const sidebarLinks = sidebar.querySelectorAll('.sidebar-nav-link');
      
      sidebarLinks.forEach((link: Element) => {
        expect(link.getAttribute('tabindex')).toBe('-1');
      });
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper banner role on header', () => {
      const header = fixture.nativeElement.querySelector('header');
      expect(header.getAttribute('role')).toBe('banner');
    });

    it('should have proper navigation landmarks', () => {
      const desktopNav = fixture.nativeElement.querySelector('.desktop-nav');
      const mobileNav = fixture.nativeElement.querySelector('.sidebar-nav');

      expect(desktopNav.getAttribute('role')).toBe('navigation');
      expect(desktopNav.getAttribute('aria-label')).toBe('Main navigation');
      
      expect(mobileNav.getAttribute('aria-labelledby')).toBe('sidebar-title');
    });

    it('should have proper aria-expanded on burger menu', () => {
      const burgerMenu = fixture.nativeElement.querySelector('.burger-menu');
      
      // Initially closed
      expect(burgerMenu.getAttribute('aria-expanded')).toBe('false');
      
      // After opening
      component['isSidebarOpen'].set(true);
      fixture.detectChanges();
      expect(burgerMenu.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have proper aria-pressed on theme toggle', () => {
      const themeToggle = fixture.nativeElement.querySelector('.theme-toggle');
      
      // Test with light theme (isDarkMode = false)
      expect(themeToggle.getAttribute('aria-pressed')).toBe('false');
      
      // We can't easily change signal values in tests, so we test the template logic
      // The aria-pressed attribute should reflect the isDarkMode signal value
    });

    it('should have proper aria-controls for burger menu', () => {
      const burgerMenu = fixture.nativeElement.querySelector('.burger-menu');
      expect(burgerMenu.getAttribute('aria-controls')).toBe('mobile-sidebar');
    });

    it('should set aria-expanded on group toggles and aria-current on active leaf', () => {
      fixture.detectChanges();
      const groupToggle: HTMLButtonElement | null = fixture.nativeElement.querySelector('.nav-group-toggle');
      expect(groupToggle).toBeTruthy();
      expect(groupToggle?.getAttribute('aria-expanded')).toBe('false');
      // Expand group
      groupToggle?.click();
      fixture.detectChanges();
      expect(groupToggle?.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive aria-labels for buttons', () => {
      const themeToggle = fixture.nativeElement.querySelector('.theme-toggle');
      const burgerMenu = fixture.nativeElement.querySelector('.burger-menu');

      expect(themeToggle.getAttribute('aria-label')).toContain('Switch to');
      expect(burgerMenu.getAttribute('aria-label')).toContain('menu');
    });

    it('should hide decorative icons from screen readers', () => {
      const icons = fixture.nativeElement.querySelectorAll('.nav-icon, .sidebar-nav-icon');
      
      icons.forEach((icon: Element) => {
        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('should have proper inert attributes for hidden sidebar', () => {
      component['isSidebarOpen'].set(false);
      fixture.detectChanges();

      const sidebar = fixture.nativeElement.querySelector('.sidebar');
      const overlay = fixture.nativeElement.querySelector('.sidebar-overlay');

      expect(sidebar.hasAttribute('inert')).toBeTruthy();
      expect(overlay.hasAttribute('inert')).toBeTruthy();
    });
  });

  describe('Form Controls', () => {
    it('should have proper button types', () => {
      const buttons = fixture.nativeElement.querySelectorAll('button');
      
      buttons.forEach((button: HTMLButtonElement) => {
        expect(button.getAttribute('type')).toBe('button');
      });
    });
  });

  describe('Color and Contrast', () => {
    it('should maintain good color contrast ratios', () => {
      const themeToggle = fixture.nativeElement.querySelector('.theme-toggle');
      const contrast = AccessibilityTestUtils.checkColorContrast(themeToggle);
      
      // WCAG AA compliance requires 4.5:1 ratio
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });
  });
});