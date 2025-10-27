import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { HeaderComponent } from './header.component';
import { ThemeService } from '../../../core/services/theme.service';
import { TranslationService } from '../../../core/services/translation.service';
import { LOCAL_STORAGE } from '../../../core/tokens/local.storage.token';

@Component({ template: '<p>Mock Dashboard</p>' })
class TestMockDashboardComponent { }

@Component({ template: '<p>Mock Login</p>' })
class TestMockLoginComponent { }

// Mock ThemeService
class MockThemeService {
  private _isDarkMode = false;
  isDarkMode(): boolean { return this._isDarkMode; }
  getThemeIcon(): string { return this._isDarkMode ? '☀️' : '🌙'; }
  toggleTheme(): void { this._isDarkMode = !this._isDarkMode; }
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockThemeService: MockThemeService;

  beforeEach(async () => {
    mockThemeService = new MockThemeService();

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        TranslateModule.forRoot({ fallbackLang: 'en' })
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'dashboard', component: TestMockDashboardComponent },
          { path: 'auth/login', component: TestMockLoginComponent }
        ]),
        { provide: ThemeService, useValue: mockThemeService },
        { 
          provide: LOCAL_STORAGE, 
          useValue: { 
            getItem: jest.fn(), 
            setItem: jest.fn(), 
            removeItem: jest.fn() 
          } 
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial sidebar state as closed', () => {
    expect(component['isSidebarOpen']()).toBe(false);
  });

  it('should toggle sidebar state', () => {
    expect(component['isSidebarOpen']()).toBe(false);
    component['toggleSidebar']();
    expect(component['isSidebarOpen']()).toBe(true);
    component['toggleSidebar']();
    expect(component['isSidebarOpen']()).toBe(false);
  });

  it('should close sidebar', () => {
    component['toggleSidebar'](); // Open it first
    expect(component['isSidebarOpen']()).toBe(true);
    
    component['closeSidebar']();
    expect(component['isSidebarOpen']()).toBe(false);
  });

  it('should have correct navigation items structure', () => {
    const navItems = component['navigationItems']();
    expect(navItems).toHaveLength(5); // dashboard, demo-books, auth, theme-demo, settings
    
    // Check dashboard item
    expect(navItems[0]).toEqual({
      id: 'dashboard',
      label: 'app.navigation.dashboard',
      path: '/dashboard',
      icon: '📊'
    });

    // Check demo-books item
    expect(navItems[1]).toEqual({
      id: 'demo-books',
      label: 'app.navigation.demo-books',
      path: '/demo-books',
      icon: '📚'
    });

    // Check auth item has children
    expect(navItems[2].id).toBe('auth');
    expect(navItems[2].children).toBeDefined();
    expect(navItems[2].children).toHaveLength(2);
  });

  it('should handle language change', () => {
    const translationService = TestBed.inject(TranslationService);
    const useSpy = jest.spyOn(translationService, 'use');

    const mockEvent = {
      target: { value: 'es' }
    } as unknown as Event;

    component['onLanguageChange'](mockEvent);

    expect(useSpy).toHaveBeenCalledWith('es');
  });

  it('should have backward compatibility method', () => {
    // Test the legacy method exists and doesn't throw
    expect(() => component.updateNavigationLinks([])).not.toThrow();
  });

  it('should inject services correctly', () => {
    expect(component['themeService']).toBe(mockThemeService);
    expect(component['i18n']).toBeDefined();
  });
});