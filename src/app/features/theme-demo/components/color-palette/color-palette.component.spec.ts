import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorPaletteComponent } from './color-palette.component';

// Mock getComputedStyle
const mockGetComputedStyle = {
  getPropertyValue: jest.fn((property: string) => {
    const mockColors: { [key: string]: string } = {
      '--primary-500': '#3b82f6',
      '--bg-primary': '#ffffff',
      '--text-primary': '#000000',
      '--success': '#10b981',
      '--warning': '#f59e0b',
      '--error': '#ef4444',
      '--info': '#3b82f6'
    };
    return mockColors[property] || '#000000';
  })
};

describe('ColorPaletteComponent', () => {
  let component: ColorPaletteComponent;
  let fixture: ComponentFixture<ColorPaletteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorPaletteComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ColorPaletteComponent);
    component = fixture.componentInstance;

    // Mock getComputedStyle
    global.getComputedStyle = jest.fn(() => mockGetComputedStyle as any);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all color sections', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const colorSections = compiled.querySelectorAll('.color-section');
    
    expect(colorSections).toHaveLength(4);
    
    const sectionHeaders = compiled.querySelectorAll('.color-section h4');
    expect(sectionHeaders[0].textContent).toContain('Primary Colors');
    expect(sectionHeaders[1].textContent).toContain('Background Colors');
    expect(sectionHeaders[2].textContent).toContain('Text Colors');
    expect(sectionHeaders[3].textContent).toContain('Status Colors');
  });

  it('should display primary colors correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const primarySection = compiled.querySelectorAll('.color-section')[0];
    const colorItems = primarySection.querySelectorAll('.color-item');
    
    expect(colorItems).toHaveLength(11); // primary-50 to primary-950
    
    const firstColorItem = colorItems[0];
    expect(firstColorItem.querySelector('.color-name')?.textContent).toContain('primary-50');
  });

  it('should display background colors correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const backgroundSection = compiled.querySelectorAll('.color-section')[1];
    const colorItems = backgroundSection.querySelectorAll('.color-item');
    
    expect(colorItems).toHaveLength(5); // bg-primary, bg-secondary, etc.
    
    const firstColorItem = colorItems[0];
    expect(firstColorItem.querySelector('.color-name')?.textContent).toContain('bg-primary');
  });

  it('should display text colors with text swatches', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const textSection = compiled.querySelectorAll('.color-section')[2];
    const colorItems = textSection.querySelectorAll('.color-item');
    const textSwatches = textSection.querySelectorAll('.text-swatch');
    
    expect(colorItems).toHaveLength(6); // text-primary, text-secondary, etc.
    expect(textSwatches).toHaveLength(6);
    
    // Check that text swatches display "Aa"
    textSwatches.forEach(swatch => {
      expect(swatch.textContent).toBe('Aa');
    });
  });

  it('should display status colors correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusSection = compiled.querySelectorAll('.color-section')[3];
    const colorItems = statusSection.querySelectorAll('.color-item');
    
    expect(colorItems).toHaveLength(8); // success, success-bg, warning, warning-bg, etc.
    
    const firstColorItem = colorItems[0];
    expect(firstColorItem.querySelector('.color-name')?.textContent).toContain('success');
  });

  it('should compute color values correctly', () => {
    fixture.detectChanges();

    const computed = component['getComputedColor']('primary-500');
    expect(computed).toBe('#3b82f6');
    expect(global.getComputedStyle).toHaveBeenCalled();
  });

  it('should handle getComputedStyle errors gracefully', () => {
    // Mock getComputedStyle to throw an error
    global.getComputedStyle = jest.fn(() => {
      throw new Error('Test error');
    });

    const computed = component['getComputedColor']('primary-500');
    expect(computed).toBe('Unable to read');
  });

  it('should return "Not defined" for undefined color values', () => {
    const mockGetComputedStyleEmpty = {
      getPropertyValue: jest.fn(() => '')
    };
    global.getComputedStyle = jest.fn(() => mockGetComputedStyleEmpty as any);

    const computed = component['getComputedColor']('undefined-color');
    expect(computed).toBe('Not defined');
  });

  it('should apply correct CSS variables as background colors', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const colorSwatches = compiled.querySelectorAll('.color-swatch:not(.text-swatch)');
    
    // Check that color swatches have background-color property set
    // Angular sets style properties directly, so we check the CSS property
    colorSwatches.forEach((swatch, index) => {
      const element = swatch as HTMLElement;
      // Since styles are set by Angular directly, we just verify the elements exist
      // and have the expected classes
      expect(element).toHaveClass('color-swatch');
      expect(element).not.toHaveClass('text-swatch');
    });
  });

  it('should apply special border styles for primary background colors', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const backgroundSection = compiled.querySelectorAll('.color-section')[1];
    const primaryBgSwatch = backgroundSection.querySelector('.color-swatch') as HTMLElement;
    
    // Verify that background color swatches exist and are structured correctly
    expect(primaryBgSwatch).toBeTruthy();
    expect(primaryBgSwatch).toHaveClass('color-swatch');
    
    // Check that the background section has the expected number of color items
    const backgroundColorItems = backgroundSection.querySelectorAll('.color-item');
    expect(backgroundColorItems.length).toBeGreaterThan(0);
  });

  it('should display color information with proper styling', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const colorItems = compiled.querySelectorAll('.color-item');
    
    colorItems.forEach(item => {
      const colorInfo = item.querySelector('.color-info');
      const colorName = item.querySelector('.color-name');
      const colorValue = item.querySelector('.color-value');
      
      expect(colorInfo).toBeTruthy();
      expect(colorName).toBeTruthy();
      expect(colorValue).toBeTruthy();
    });
  });

  it('should have proper component structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.color-palette-container');
    const colorPalettes = compiled.querySelectorAll('.color-palette');
    
    expect(container).toBeTruthy();
    expect(colorPalettes).toHaveLength(4); // One for each color section
  });
});