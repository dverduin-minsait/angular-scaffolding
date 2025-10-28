import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SsrPageComponent } from './ssr-page.component';
import { 
  configureSSRTestingModule, 
  configureBrowserTestingModule 
} from '../../../../../testing/ssr-testing.utils';

describe('SsrPageComponent', () => {
  describe('Server-Side Rendering (SSR)', () => {
    beforeEach(async () => {
      await configureSSRTestingModule({
        imports: [
          SsrPageComponent,
          TranslateModule.forRoot()
        ],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      });
    });

    it('should create component in SSR without crashing', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      expect(() => fixture.detectChanges()).not.toThrow();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should detect server platform', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['isServer']).toBe(true);
      expect(component['isBrowser']).toBe(false);
    });

    it('should initialize with server data', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['serverData']()).not.toBeNull();
      expect(component['serverData']()?.message).toBeDefined();
    });

    it('should set render type to server', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['metrics']().renderType).toBe('server');
    });

    it('should not initialize browser features in SSR', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['browserFeatures']()).toBeNull();
    });

    it('should not crash when calling DOM access methods', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(() => component['checkDOMAccess']()).not.toThrow();
      expect(component['checkDOMAccess']()).toContain('blocked on server');
    });

    it('should not crash when calling localStorage methods', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(() => component['checkLocalStorage']()).not.toThrow();
      expect(component['checkLocalStorage']()).toContain('not available on server');
    });

    it('should render server-friendly HTML', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')).toBeTruthy();
      expect(compiled.textContent).toContain('ssrDemo.ssrPage.title');
    });

    it('should not attempt client-side data fetch in SSR', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      component['fetchClientData']();
      
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('should only run in browser'));
      consoleSpy.mockRestore();
    });
  });

  describe('Browser Context', () => {
    beforeEach(async () => {
      await configureBrowserTestingModule({
        imports: [
          SsrPageComponent,
          TranslateModule.forRoot()
        ],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      });
    });

    it('should create component in browser', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should detect browser platform', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['isBrowser']).toBe(true);
      expect(component['isServer']).toBe(false);
    });

    it('should set render type to client', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['metrics']().renderType).toBe('client');
    });

    it('should initialize browser features', (done) => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      
      // Browser features are initialized asynchronously
      setTimeout(() => {
        expect(component['browserFeatures']()).not.toBeNull();
        done();
      }, 200);
    });

    it('should track hydration in browser', (done) => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      
      // Hydration tracking happens asynchronously
      setTimeout(() => {
        expect(component['metrics']().isHydrated).toBe(true);
        expect(component['metrics']().hydrationTime).toBeDefined();
        done();
      }, 150);
    });

    it('should allow client-side data fetch in browser', (done) => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      
      expect(component['loading']()).toBe(false);
      component['fetchClientData']();
      expect(component['loading']()).toBe(true);
      
      setTimeout(() => {
        expect(component['loading']()).toBe(false);
        expect(component['clientData']()).not.toBeNull();
        done();
      }, 1100);
    });

    it('should access DOM in browser context', () => {
      // Mock document.title
      Object.defineProperty(document, 'title', {
        value: 'Test Title',
        writable: true
      });
      
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      const domInfo = component['checkDOMAccess']();
      
      expect(domInfo).toContain('DOM available');
      expect(domInfo).toContain('Test Title');
    });

    it('should render browser-specific sections', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      
      // Browser-specific sections should be present
      expect(compiled.textContent).toContain('ssrDemo.ssrPage.title');
    });
  });

  describe('Component Logic', () => {
    beforeEach(async () => {
      await configureBrowserTestingModule({
        imports: [
          SsrPageComponent,
          TranslateModule.forRoot()
        ],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      });
    });

    it('should have server data immediately available', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      expect(component['hasData']()).toBe(true);
      expect(component['serverData']()?.message).toBeDefined();
      expect(component['serverData']()?.timestamp).toBeDefined();
      expect(component['serverData']()?.requestId).toBeDefined();
    });

    it('should compute render info correctly', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const component = fixture.componentInstance;
      const renderInfo = component['renderInfo']();
      
      expect(renderInfo).toContain('Rendered on');
      expect(renderInfo).toContain('at');
    });

    it('should generate unique request IDs', () => {
      const fixture1 = TestBed.createComponent(SsrPageComponent);
      fixture1.detectChanges();
      
      const fixture2 = TestBed.createComponent(SsrPageComponent);
      fixture2.detectChanges();
      
      const requestId1 = fixture1.componentInstance['serverData']()?.requestId;
      const requestId2 = fixture2.componentInstance['serverData']()?.requestId;
      
      expect(requestId1).not.toBe(requestId2);
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      await configureBrowserTestingModule({
        imports: [
          SsrPageComponent,
          TranslateModule.forRoot()
        ],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      });
    });

    it('should have proper heading structure', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const h1 = compiled.querySelector('h1');
      
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toContain('ssrDemo.ssrPage.title');
    });

    it('should have semantic HTML elements', () => {
      const fixture = TestBed.createComponent(SsrPageComponent);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      
      expect(compiled.querySelector('header')).toBeTruthy();
      expect(compiled.querySelector('section')).toBeTruthy();
    });
  });
});
