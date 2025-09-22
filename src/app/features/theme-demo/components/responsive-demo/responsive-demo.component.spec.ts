import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResponsiveDemoComponent } from './responsive-demo.component';

describe('ResponsiveDemoComponent', () => {
  let component: ResponsiveDemoComponent;
  let fixture: ComponentFixture<ResponsiveDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResponsiveDemoComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveDemoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display grid demo with 6 items', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const gridItems = compiled.querySelectorAll('.grid-item');
    
    expect(gridItems).toHaveLength(6);
    
    // Check that each item has the correct text content
    gridItems.forEach((item, index) => {
      expect(item.textContent?.trim()).toBe(`Item ${index + 1}`);
    });
  });

  it('should display responsive note', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const responsiveNote = compiled.querySelector('.responsive-note');
    
    expect(responsiveNote).toBeTruthy();
    expect(responsiveNote?.textContent?.trim()).toContain('This grid automatically adapts to different screen sizes and themes.');
  });

  it('should have proper component structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.responsive-demo');
    const gridDemo = compiled.querySelector('.grid-demo');
    
    expect(container).toBeTruthy();
    expect(gridDemo).toBeTruthy();
    
    // Grid demo should be inside responsive demo container
    expect(container?.contains(gridDemo as Node)).toBe(true);
  });

  it('should apply correct CSS classes to grid items', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const gridItems = compiled.querySelectorAll('.grid-item');
    
    gridItems.forEach(item => {
      expect(item).toHaveClass('grid-item');
    });
  });

  it('should have grid demo container with proper structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const gridDemo = compiled.querySelector('.grid-demo');
    const gridItems = gridDemo?.querySelectorAll('.grid-item');
    
    expect(gridDemo).toBeTruthy();
    expect(gridItems).toHaveLength(6);
    
    // All grid items should be direct children of grid-demo
    const directChildren = Array.from(gridDemo?.children || []);
    expect(directChildren).toHaveLength(6);
    directChildren.forEach(child => {
      expect(child).toHaveClass('grid-item');
    });
  });

  it('should display items with sequential numbering', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const gridItems = compiled.querySelectorAll('.grid-item');
    
    for (let i = 0; i < gridItems.length; i++) {
      const expectedText = `Item ${i + 1}`;
      expect(gridItems[i].textContent?.trim()).toBe(expectedText);
    }
  });

  it('should have responsive note with correct styling class', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const responsiveNote = compiled.querySelector('.responsive-note');
    
    expect(responsiveNote).toBeTruthy();
    expect(responsiveNote?.tagName.toLowerCase()).toBe('p');
  });

  it('should maintain proper hierarchy structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.responsive-demo');
    
    expect(container).toBeTruthy();
    
    // Check expected children order
    const children = Array.from(container?.children || []);
    expect(children).toHaveLength(2);
    
    expect(children[0]).toHaveClass('grid-demo');
    expect(children[1]).toHaveClass('responsive-note');
  });

  it('should be a simple component without complex interactions', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should not have any buttons or form elements
    expect(compiled.querySelectorAll('button')).toHaveLength(0);
    expect(compiled.querySelectorAll('input')).toHaveLength(0);
    expect(compiled.querySelectorAll('select')).toHaveLength(0);
    
    // Should be purely presentational
    expect(compiled.querySelectorAll('.grid-item')).toHaveLength(6);
    expect(compiled.querySelector('.responsive-note')).toBeTruthy();
  });

  it('should have consistent grid item content', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const gridItems = compiled.querySelectorAll('.grid-item');
    
    gridItems.forEach((item, index) => {
      // Each item should have simple text content
      const textContent = item.textContent?.trim();
      expect(textContent).toBe(`Item ${index + 1}`);
      
      // Should not have nested elements
      expect(item.children).toHaveLength(0);
    });
  });

  it('should render all content as expected', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Verify the complete rendered structure
    expect(compiled.querySelector('.responsive-demo .grid-demo')).toBeTruthy();
    expect(compiled.querySelectorAll('.responsive-demo .grid-demo .grid-item')).toHaveLength(6);
    expect(compiled.querySelector('.responsive-demo .responsive-note')).toBeTruthy();
    
    // Verify content is not empty
    const gridItems = compiled.querySelectorAll('.grid-item');
    gridItems.forEach(item => {
      expect(item.textContent?.trim()).toBeTruthy();
    });
    
    const note = compiled.querySelector('.responsive-note');
    expect(note?.textContent?.trim()).toBeTruthy();
  });
});