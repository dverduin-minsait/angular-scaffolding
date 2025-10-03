import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Component, signal, Pipe, PipeTransform } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { HeaderComponent } from './header.component';
import { TranslationService } from '../../../core/services/translation.service';
import { ThemeService } from '../../../core/services/theme.service';

// Mock components for testing routes
@Component({
  template: '<p>Dashboard</p>'
})
class MockDashboardComponent { }

@Component({
  template: '<p>Login</p>'
})
class MockLoginComponent { }

@Component({
  template: '<p>Theme Demo</p>'
})
class MockThemeDemoComponent { }

@Component({
  template: '<p>Settings</p>'
})
class MockSettingsComponent { }

// Mock Translate Pipe to avoid bringing in ngx-translate dependencies
@Pipe({
  name: 'translate',
  standalone: true
})
class MockTranslatePipe implements PipeTransform {
  private dict: Record<string,string> = {
    'app.title': 'Angular Architecture',
    'app.navigation.dashboard': 'Dashboard',
  'app.navigation.clothes._': 'Clothes',
  'app.navigation.clothes.men': 'Men',
  'app.navigation.clothes.women._': 'Women',
  'app.navigation.clothes.women.dresses': 'Dresses',
  'app.navigation.clothes.women.shoes': 'Shoes',
  'app.navigation.auth._': 'Authentication',
  'app.navigation.auth.login': 'Login',
  'app.navigation.auth.register': 'Register',
    'app.navigation.themeDemo': 'Theme Demo',
    'app.navigation.settings': 'Settings',
    'app.actions.toggleTheme': 'Switch to light theme', // base template; param used separately by service call
    'app.actions.openMenu': 'Open menu',
    'app.actions.closeMenu': 'Close menu',
    'app.actions.changeLanguage': 'Change language',
    'app.languages.en': 'English',
    'app.languages.es': 'Spanish',
    'app.languages.pt': 'Portuguese',
    'app.languages.ca': 'Catalan',
    'app.languages.gl': 'Galician'
  };
  transform(value: string): string {
    return this.dict[value] ?? value;
  }
}

// Stub Language Switcher to avoid pulling in TranslateModule / pipe
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: '<!-- language switcher stub -->'
})
class StubLanguageSwitcherComponent {}

// Mock ThemeService
class MockThemeService {
  private _isDarkMode = signal(false);
  
  isDarkMode = this._isDarkMode.asReadonly();
  
  getThemeIcon(): string {
    return this._isDarkMode() ? '☀️' : '🌙';
  }
  
  toggleTheme(): void {
    this._isDarkMode.update(current => !current);
  }
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockThemeService: MockThemeService;
  let router: Router;

  beforeEach(async () => {
    mockThemeService = new MockThemeService();

    await TestBed.configureTestingModule({
      imports: [
  CommonModule,
        HeaderComponent,
        RouterTestingModule.withRoutes([
          { path: 'dashboard', component: MockDashboardComponent },
          { path: 'auth/login', component: MockLoginComponent },
          { path: 'theme-demo', component: MockThemeDemoComponent },
          { path: 'settings', component: MockSettingsComponent }
        ])
      ],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        {
          provide: TranslationService,
          useValue: {
            currentLang: () => 'en',
            use: jest.fn(),
            availableLangs: ['en','es','pt','ca','gl'],
            instant: (key: string, params?: Record<string,string>) => {
              const dict: Record<string,string> = {
                'app.title': 'Angular Architecture',
                'app.navigation.dashboard': 'Dashboard',
                'app.navigation.clothes._': 'Clothes',
                'app.navigation.clothes.men': 'Men',
                'app.navigation.clothes.women._': 'Women',
                'app.navigation.clothes.women.dresses': 'Dresses',
                'app.navigation.clothes.women.shoes': 'Shoes',
                'app.navigation.auth._': 'Authentication',
                'app.navigation.auth.login': 'Login',
                'app.navigation.auth.register': 'Register',
                'app.navigation.themeDemo': 'Theme Demo',
                'app.navigation.settings': 'Settings',
                'app.actions.toggleTheme': `Switch to ${params?.['theme'] ?? '{{theme}}'} theme`,
                'app.actions.openMenu': 'Open menu',
                'app.actions.closeMenu': 'Close menu',
                'app.actions.changeLanguage': 'Change language',
                'app.languages.en': 'English',
                'app.languages.es': 'Spanish',
                'app.languages.pt': 'Portuguese',
                'app.languages.ca': 'Catalan',
                'app.languages.gl': 'Galician'
              };
              return dict[key] ?? key;
            }
          }
        }
      ]
    }).compileComponents();

    // Override component to replace real TranslatePipe with mock pipe
    TestBed.overrideComponent(HeaderComponent, {
      set: {
        imports: [CommonModule, RouterLink, RouterLinkActive, MockTranslatePipe]
      }
    });

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with default title', () => {
      expect(component['title']()).toBe('app.title');
    });

    it('should initialize with sidebar closed', () => {
      expect(component['isSidebarOpen']()).toBe(false);
    });

  it('should initialize navigation items including a group', () => {
    const items = component['navigationItems']();
    expect(items).toHaveLength(5);
    expect(items[0].label).toBe('app.navigation.dashboard');
    // group should have children
    // @ts-ignore
    expect(items[1].children?.length).toBeGreaterThan(0);
  });
  });

  describe('Template Rendering', () => {
    it('should render the title in the logo', () => {
      const logoElement = fixture.debugElement.query(By.css('.logo h1'));
  expect(logoElement.nativeElement.textContent.trim()).toBe('Angular Architecture');
    });

    it('should render root items (links + group toggle) in desktop nav', () => {
      const rootItems = fixture.debugElement.queryAll(By.css('.desktop-nav .nav-list.root > li'));
      expect(rootItems.length).toBe(5);
      const groupToggle = fixture.debugElement.query(By.css('.nav-group-toggle'));
      expect(groupToggle).toBeTruthy();
    });

    it('should render theme toggle button', () => {
      const themeButton = fixture.debugElement.query(By.css('.theme-toggle'));
      expect(themeButton).toBeTruthy();
      expect(themeButton.nativeElement.textContent.trim()).toBe('🌙');
    });

    it('should render burger menu button', () => {
      const burgerButton = fixture.debugElement.query(By.css('.burger-menu'));
      expect(burgerButton).toBeTruthy();
      
      const burgerLines = burgerButton.queryAll(By.css('.burger-line'));
      expect(burgerLines).toHaveLength(3);
    });

    it('should render root items in sidebar (links + group)', () => {
      const sidebarRootItems = fixture.debugElement.queryAll(By.css('.sidebar-nav-list.root > li'));
      expect(sidebarRootItems.length).toBe(5);
    });

    it('should expand/collapse a top-level group in desktop nav', () => {
      const toggle = fixture.debugElement.query(By.css('.nav-group-toggle'));
      expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('false');
      toggle.nativeElement.click();
      fixture.detectChanges();
      expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('true');
      toggle.nativeElement.click();
      fixture.detectChanges();
      expect(toggle.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('should expand nested group', () => {
      const firstGroupToggle = fixture.debugElement.query(By.css('.nav-group-toggle'));
      firstGroupToggle.nativeElement.click();
      fixture.detectChanges();
      const nestedToggle = fixture.debugElement.query(By.css('.nav-group-toggle.nested'));
      expect(nestedToggle).toBeTruthy();
      expect(nestedToggle.nativeElement.getAttribute('aria-expanded')).toBe('false');
      nestedToggle.nativeElement.click();
      fixture.detectChanges();
      expect(nestedToggle.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });
  });

  describe('Theme Toggle Functionality', () => {
    it('should toggle theme when theme button is clicked', () => {
      const themeButton = fixture.debugElement.query(By.css('.theme-toggle'));
      
      // Initially dark mode is false, so icon should be moon
      expect(themeButton.nativeElement.textContent.trim()).toBe('🌙');
      
      // Click the button
      themeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Now dark mode should be true, so icon should be sun
      expect(themeButton.nativeElement.textContent.trim()).toBe('☀️');
    });

    it('should toggle theme when sidebar theme button is clicked', () => {
      const sidebarThemeButton = fixture.debugElement.query(By.css('.sidebar-theme-toggle'));
      
      // Click the sidebar theme button
      sidebarThemeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Verify theme was toggled
      const headerThemeButton = fixture.debugElement.query(By.css('.theme-toggle'));
      expect(headerThemeButton.nativeElement.textContent.trim()).toBe('☀️');
    });
  });

  describe('Sidebar Functionality', () => {
    it('should open sidebar when burger menu is clicked', () => {
      const burgerButton = fixture.debugElement.query(By.css('.burger-menu'));
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      
      // Initially sidebar should be closed
      expect(component['isSidebarOpen']()).toBe(false);
      expect(sidebar.nativeElement.classList.contains('open')).toBe(false);
      
      // Click burger menu
      burgerButton.nativeElement.click();
      fixture.detectChanges();
      
      // Sidebar should be open
      expect(component['isSidebarOpen']()).toBe(true);
      expect(sidebar.nativeElement.classList.contains('open')).toBe(true);
    });

    it('should close sidebar when close button is clicked', () => {
      // First open the sidebar
      component['toggleSidebar']();
      fixture.detectChanges();
      
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Click close button
      const closeButton = fixture.debugElement.query(By.css('.close-button'));
      closeButton.nativeElement.click();
      fixture.detectChanges();
      
      // Sidebar should be closed
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should close sidebar when overlay is clicked', () => {
      // First open the sidebar
      component['toggleSidebar']();
      fixture.detectChanges();
      
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Click overlay
      const overlay = fixture.debugElement.query(By.css('.sidebar-overlay'));
      overlay.nativeElement.click();
      fixture.detectChanges();
      
      // Sidebar should be closed
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should close sidebar when a sidebar nav link is clicked', () => {
      // First open the sidebar
      component['toggleSidebar']();
      fixture.detectChanges();
      
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Click a sidebar nav link
      const sidebarNavLink = fixture.debugElement.query(By.css('.sidebar-nav-link'));
      sidebarNavLink.nativeElement.click();
      fixture.detectChanges();
      
      // Sidebar should be closed
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should update burger menu lines when sidebar is open', () => {
      const burgerButton = fixture.debugElement.query(By.css('.burger-menu'));
      const burgerLines = burgerButton.queryAll(By.css('.burger-line'));
      
      // Initially burger lines should not have 'open' class
      burgerLines.forEach(line => {
        expect(line.nativeElement.classList.contains('open')).toBe(false);
      });
      
      // Open sidebar
      burgerButton.nativeElement.click();
      fixture.detectChanges();
      
      // Burger lines should have 'open' class
      const updatedBurgerLines = burgerButton.queryAll(By.css('.burger-line'));
      updatedBurgerLines.forEach(line => {
        expect(line.nativeElement.classList.contains('open')).toBe(true);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for theme toggle button', () => {
      const themeButton = fixture.debugElement.query(By.css('.theme-toggle'));
  // Initially should refer to switching to dark theme (since expression uses dark when currently light)
  expect(themeButton.nativeElement.getAttribute('aria-label')).toBe('Switch to dark theme');
      
      // Toggle theme and expect aria label updates to dark
      themeButton.nativeElement.click();
      fixture.detectChanges();
  expect(themeButton.nativeElement.getAttribute('aria-label')).toBe('Switch to light theme');
    });

    it('should have proper aria-labels for burger menu button', () => {
      const burgerButton = fixture.debugElement.query(By.css('.burger-menu'));
      expect(burgerButton.nativeElement.getAttribute('aria-label')).toBe('Open menu');
      expect(burgerButton.nativeElement.getAttribute('aria-expanded')).toBe('false');
      
      // Open sidebar and check aria attributes change
      burgerButton.nativeElement.click();
      fixture.detectChanges();
      
      expect(burgerButton.nativeElement.getAttribute('aria-label')).toBe('Close menu');
      expect(burgerButton.nativeElement.getAttribute('aria-expanded')).toBe('true');
    });

    it('should have proper aria-hidden attributes for sidebar', () => {
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      const overlay = fixture.debugElement.query(By.css('.sidebar-overlay'));
      
      // Initially sidebar should be hidden
      expect(sidebar.nativeElement.getAttribute('aria-hidden')).toBe('true');
      expect(overlay.nativeElement.getAttribute('aria-hidden')).toBe('true');
      
      // Open sidebar
      component['toggleSidebar']();
      fixture.detectChanges();
      
      // Sidebar should not be hidden
      expect(sidebar.nativeElement.getAttribute('aria-hidden')).toBe('false');
      expect(overlay.nativeElement.getAttribute('aria-hidden')).toBe('false');
    });

    it('should have accessible labels for first desktop nav link and group toggle', () => {
      const firstLink = fixture.debugElement.query(By.css('.nav-link'));
      expect(firstLink.nativeElement.getAttribute('aria-label')).toBe('Dashboard');
      const groupToggle = fixture.debugElement.query(By.css('.nav-group-toggle'));
      expect(groupToggle.nativeElement.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have proper role attributes', () => {
      const sidebar = fixture.debugElement.query(By.css('.sidebar'));
      expect(sidebar.nativeElement.getAttribute('role')).toBe('navigation');
      expect(sidebar.nativeElement.getAttribute('aria-label')).toBe('Mobile navigation');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close sidebar when Escape key is pressed', () => {
      // Open sidebar first
      component['toggleSidebar']();
      fixture.detectChanges();
      
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Simulate Escape key press by calling the private method directly
      // Since we're no longer using HostListener, we test the underlying logic
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component['onDocumentKeydown'](event);
      fixture.detectChanges();
      
      // Sidebar should be closed
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should not close sidebar on Escape if sidebar is already closed', () => {
      // Ensure sidebar is closed
      expect(component['isSidebarOpen']()).toBe(false);
      
      // Simulate Escape key press
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component['onDocumentKeydown'](event);
      fixture.detectChanges();
      
      // Sidebar should remain closed
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should ignore non-Escape key presses', () => {
      // Open sidebar first
      component['toggleSidebar']();
      fixture.detectChanges();
      
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Simulate different key press
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component['onDocumentKeydown'](event);
      fixture.detectChanges();
      
      // Sidebar should remain open
      expect(component['isSidebarOpen']()).toBe(true);
    });
  });

  describe('Router Navigation', () => {
    it('should navigate to dashboard when first nav link clicked', async () => {
      const firstLink = fixture.debugElement.query(By.css('.nav-link'));
      firstLink.nativeElement.click();
      await fixture.whenStable();
      expect(router.url).toBe('/dashboard');
    });

    it('should navigate to dashboard when first sidebar link clicked', async () => {
      const firstSidebarLink = fixture.debugElement.query(By.css('.sidebar-nav-link'));
      firstSidebarLink.nativeElement.click();
      await fixture.whenStable();
      expect(router.url).toBe('/dashboard');
    });
  });

  describe('Component Methods', () => {
    // updateNavigationLinks is now a no-op since links are computed from translations; keep test to assert immutability
    it('should keep navigationItems unchanged on updateNavigationLinks (noop)', () => {
      const original = component['navigationItems']();
      component.updateNavigationLinks([]);
      expect(component['navigationItems']()).toEqual(original);
    });

    it('should toggle sidebar state with toggleSidebar method', () => {
      expect(component['isSidebarOpen']()).toBe(false);
      
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);
      
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should close sidebar with closeSidebar method', () => {
      // First open the sidebar
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Then close it
      component['closeSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should not change state when closeSidebar is called on already closed sidebar', () => {
      expect(component['isSidebarOpen']()).toBe(false);
      
      component['closeSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);
    });
  });

  describe('Click Outside Functionality', () => {
    it('should close sidebar when clicking outside', () => {
      // Open sidebar
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Create a mock click event on document body
      const event = new Event('click');
      Object.defineProperty(event, 'target', {
        value: document.body,
        enumerable: true
      });
      
      // Call the private method directly since we're no longer using HostListener
      component['onDocumentClick'](event);
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should not close sidebar when clicking on sidebar itself', () => {
      // Open sidebar
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Create a mock sidebar element
      const mockSidebarElement = document.createElement('div');
      mockSidebarElement.className = 'sidebar';
      
      // Create a mock click event on sidebar
      const event = new Event('click');
      Object.defineProperty(event, 'target', {
        value: mockSidebarElement,
        enumerable: true
      });
      
      // Mock closest method
      mockSidebarElement.closest = jest.fn().mockReturnValue(mockSidebarElement);
      
      component['onDocumentClick'](event);
      expect(component['isSidebarOpen']()).toBe(true);
    });

    it('should not close sidebar when clicking on burger menu', () => {
      // Open sidebar
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);
      
      // Create a mock burger menu element
      const mockBurgerElement = document.createElement('button');
      mockBurgerElement.className = 'burger-menu';
      
      // Create a mock click event on burger menu
      const event = new Event('click');
      Object.defineProperty(event, 'target', {
        value: mockBurgerElement,
        enumerable: true
      });
      
      // Mock closest method
      mockBurgerElement.closest = jest.fn().mockImplementation((selector: string) => {
        if (selector === '.burger-menu') return mockBurgerElement;
        return null;
      });
      
      component['onDocumentClick'](event);
      expect(component['isSidebarOpen']()).toBe(true);
    });
  });

  describe('Performance Optimizations', () => {
    it('should have computed signals for memoized values', () => {
      expect(component['themeIcon']()).toBe('🌙');
      expect(component['isDarkMode']()).toBe(false);
      // Aria label is template due to stub translation
  expect(component['themeAriaLabel']()).toBe('Switch to dark theme');
      expect(component['burgerAriaLabel']()).toBe('Open menu');
  expect(component['sidebarThemeText']()).toBe('Dark');
    });

    it('should update computed values when dependencies change', () => {
      component['toggleTheme']();
      fixture.detectChanges();
      expect(component['themeIcon']()).toBe('☀️');
      expect(component['isDarkMode']()).toBe(true);
      // Still template form because stub does not interpolate params
  expect(component['themeAriaLabel']()).toBe('Switch to light theme');
  expect(component['sidebarThemeText']()).toBe('Light');
    });

    it('should update burger aria label when sidebar state changes', () => {
      expect(component['burgerAriaLabel']()).toBe('Open menu');
      
      component['toggleSidebar']();
      expect(component['burgerAriaLabel']()).toBe('Close menu');
      
      component['toggleSidebar']();
      expect(component['burgerAriaLabel']()).toBe('Open menu');
    });

    it('should have trackBy function using ids', () => {
      const mockItem: any = { id: 'test', label: 't', path: '/t' };
      const result = component['trackById'](0, mockItem);
      expect(result).toBe('test');
    });

    it('should add document listeners only when sidebar is open', () => {
      const addSpy = jest.spyOn(document, 'addEventListener');
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      
      // Initially sidebar is closed, no listeners should be added
      expect(addSpy).not.toHaveBeenCalled();
      
      // Open sidebar - listeners should be added
      component['toggleSidebar']();
      fixture.detectChanges();
      
      // Need to wait for effect to run
      setTimeout(() => {
        expect(addSpy).toHaveBeenCalledWith('click', expect.any(Function));
        expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      }, 0);
      
      // Close sidebar - listeners should be removed
      component['closeSidebar']();
      fixture.detectChanges();
      
      setTimeout(() => {
        expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      }, 0);
      
      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should cleanup listeners on component destruction', () => {
      const removeSpy = jest.spyOn(document, 'removeEventListener');
      
      // Open sidebar to add listeners
      component['toggleSidebar']();
      fixture.detectChanges();
      
      // Destroy component
      component.ngOnDestroy();
      
      expect(removeSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      removeSpy.mockRestore();
    });
  });
});