import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { InteractiveDemoComponent } from './interactive-demo.component';

describe('InteractiveDemoComponent', () => {
  let component: InteractiveDemoComponent;
  let fixture: ComponentFixture<InteractiveDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InteractiveDemoComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InteractiveDemoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display all component groups', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const componentGroups = compiled.querySelectorAll('.component-group');
    
    expect(componentGroups).toHaveLength(3);
    
    const groupHeaders = compiled.querySelectorAll('.component-group h4');
    expect(groupHeaders[0].textContent).toContain('Buttons');
    expect(groupHeaders[1].textContent).toContain('Form Elements');
    expect(groupHeaders[2].textContent).toContain('Cards');
  });

  it('should display button demos with correct classes', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const buttonsSection = compiled.querySelectorAll('.component-group')[0];
    const buttons = buttonsSection.querySelectorAll('button');
    
    expect(buttons).toHaveLength(4);
    
  // Updated to BEM class naming (legacy alias btn-primary removed)
  expect(buttons[0]).toHaveClass('btn--primary');
    expect(buttons[0].textContent?.trim()).toBe('Primary Button');
    
  expect(buttons[1]).toHaveClass('btn--secondary');
    expect(buttons[1].textContent?.trim()).toBe('Secondary Button');
    
  expect(buttons[2]).toHaveClass('btn--ghost');
    expect(buttons[2].textContent?.trim()).toBe('Ghost Button');
    
  expect(buttons[3]).toHaveClass('btn--primary');
    expect(buttons[3].textContent?.trim()).toBe('Disabled Button');
    expect(buttons[3]).toBeDisabled();
  });

  it('should display form elements correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const formsSection = compiled.querySelectorAll('.component-group')[1];
    
    // Check labels
    const labels = formsSection.querySelectorAll('label:not(.checkbox-label)');
    expect(labels).toHaveLength(3);
    expect(labels[0].textContent?.trim()).toBe('Text Input');
    expect(labels[1].textContent?.trim()).toBe('Email Input');
    expect(labels[2].textContent?.trim()).toBe('Select');
    
    // Check inputs
    const textInput = formsSection.querySelector('input[type="text"]') as HTMLInputElement;
    expect(textInput).toBeTruthy();
    expect(textInput.placeholder).toBe('Enter text...');
    
    const emailInput = formsSection.querySelector('input[type="email"]') as HTMLInputElement;
    expect(emailInput).toBeTruthy();
    expect(emailInput.placeholder).toBe('Enter email...');
    
    // Check select
    const select = formsSection.querySelector('select') as HTMLSelectElement;
    expect(select).toBeTruthy();
    const options = select.querySelectorAll('option');
    expect(options).toHaveLength(3);
    
    // Check checkbox
    const checkbox = formsSection.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(checkbox.checked).toBe(true);
    
    const checkboxLabel = formsSection.querySelector('.checkbox-label span');
    expect(checkboxLabel?.textContent?.trim()).toBe('Checkbox option');
  });

  it('should display card demos correctly', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const cardsSection = compiled.querySelectorAll('.component-group')[2];
    const cards = cardsSection.querySelectorAll('.demo-card');
    
    expect(cards).toHaveLength(2);
    
    // First card
    const firstCard = cards[0];
    expect(firstCard.querySelector('h5')?.textContent?.trim()).toBe('Standard Card');
    expect(firstCard.querySelector('p')?.textContent?.trim()).toContain('standard card styling');
    
    const firstCardButton = firstCard.querySelector('button');
  expect(firstCardButton).toHaveClass('btn--primary');
  expect(firstCardButton).toHaveClass('btn--sm');
    expect(firstCardButton?.textContent?.trim()).toBe('Action');
    
    // Second card
    const secondCard = cards[1];
    expect(secondCard.querySelector('h5')?.textContent?.trim()).toBe('Another Card');
    expect(secondCard.querySelector('p')?.textContent?.trim()).toContain('automatically adapt');
    
    const secondCardButton = secondCard.querySelector('button');
  expect(secondCardButton).toHaveClass('btn--secondary');
  expect(secondCardButton).toHaveClass('btn--sm');
    expect(secondCardButton?.textContent?.trim()).toBe('Secondary');
  });

  it('should have proper form structure and accessibility', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const formsSection = compiled.querySelectorAll('.component-group')[1];
    
    // Check label-input associations
    const textLabel = formsSection.querySelector('label[for="demo-text"]');
    const textInput = formsSection.querySelector('#demo-text');
    expect(textLabel).toBeTruthy();
    expect(textInput).toBeTruthy();
    
    const emailLabel = formsSection.querySelector('label[for="demo-email"]');
    const emailInput = formsSection.querySelector('#demo-email');
    expect(emailLabel).toBeTruthy();
    expect(emailInput).toBeTruthy();
    
    const selectLabel = formsSection.querySelector('label[for="demo-select"]');
    const selectInput = formsSection.querySelector('#demo-select');
    expect(selectLabel).toBeTruthy();
    expect(selectInput).toBeTruthy();
  });

  it('should apply correct CSS classes and structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const container = compiled.querySelector('.interactive-demo');
    
    expect(container).toBeTruthy();
    expect(container?.querySelector('.component-grid')).toBeTruthy();
    
    const componentGroups = container?.querySelectorAll('.component-group');
    expect(componentGroups).toHaveLength(3);
    
    expect(container?.querySelector('.demo-buttons')).toBeTruthy();
    expect(container?.querySelector('.demo-inputs')).toBeTruthy();
    expect(container?.querySelector('.demo-cards')).toBeTruthy();
  });

  it('should have interactive elements that can receive focus', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Test buttons can be focused
    const buttons = compiled.querySelectorAll('button:not([disabled])');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
    
    // Test form inputs can be focused
    const inputs = compiled.querySelectorAll('input:not([disabled])');
    inputs.forEach(input => {
      expect(input).not.toBeDisabled();
    });
    
    const select = compiled.querySelector('select');
    expect(select).not.toBeDisabled();
  });

  it('should display content with proper typography', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check headers
    const headers = compiled.querySelectorAll('h4, h5');
    headers.forEach(header => {
      expect(header.textContent?.trim()).toBeTruthy();
    });
    
    // Check paragraphs in cards
    const paragraphs = compiled.querySelectorAll('.demo-card p');
    paragraphs.forEach(p => {
      expect(p.textContent?.trim()).toBeTruthy();
    });
  });
});