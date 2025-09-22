import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the title', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('h1');
    
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent?.trim()).toBe('Dashboard');
  });

  it('should display the description', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const descriptionElement = compiled.querySelector('p');
    
    expect(descriptionElement).toBeTruthy();
    expect(descriptionElement?.textContent?.trim()).toBe('Welcome to your Angular 20 Architecture Blueprint dashboard!');
  });

  it('should display all dashboard stats', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statCards = compiled.querySelectorAll('.stat-card');
    
    expect(statCards).toHaveLength(4);
  });

  it('should display correct stat values and labels', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statCards = compiled.querySelectorAll('.stat-card');
    
    // First stat: Active Users
    const firstStatValue = statCards[0].querySelector('h3');
    const firstStatLabel = statCards[0].querySelector('p');
    expect(firstStatValue?.textContent?.trim()).toBe('1,234');
    expect(firstStatLabel?.textContent?.trim()).toBe('Active Users');
    
    // Second stat: Total Projects
    const secondStatValue = statCards[1].querySelector('h3');
    const secondStatLabel = statCards[1].querySelector('p');
    expect(secondStatValue?.textContent?.trim()).toBe('42');
    expect(secondStatLabel?.textContent?.trim()).toBe('Total Projects');
    
    // Third stat: Completed Tasks
    const thirdStatValue = statCards[2].querySelector('h3');
    const thirdStatLabel = statCards[2].querySelector('p');
    expect(thirdStatValue?.textContent?.trim()).toBe('87%');
    expect(thirdStatLabel?.textContent?.trim()).toBe('Completed Tasks');
    
    // Fourth stat: Performance
    const fourthStatValue = statCards[3].querySelector('h3');
    const fourthStatLabel = statCards[3].querySelector('p');
    expect(fourthStatValue?.textContent?.trim()).toBe('98%');
    expect(fourthStatLabel?.textContent?.trim()).toBe('Performance');
  });

  it('should have proper dashboard structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dashboardContainer = compiled.querySelector('.dashboard');
    const statsContainer = compiled.querySelector('.dashboard-stats');
    
    expect(dashboardContainer).toBeTruthy();
    expect(statsContainer).toBeTruthy();
    
    // Stats container should be inside dashboard container
    expect(dashboardContainer?.contains(statsContainer as Node)).toBe(true);
  });

  it('should have correct CSS classes applied', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const rootElement = compiled.querySelector('.dashboard');
    const statsContainer = compiled.querySelector('.dashboard-stats');
    const statCards = compiled.querySelectorAll('.stat-card');
    
    expect(rootElement).toHaveClass('dashboard');
    expect(statsContainer).toHaveClass('dashboard-stats');
    
    statCards.forEach(card => {
      expect(card).toHaveClass('stat-card');
    });
  });

  it('should render stats in the correct order', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const statLabels = compiled.querySelectorAll('.stat-card p');
    
    expect(statLabels[0].textContent?.trim()).toBe('Active Users');
    expect(statLabels[1].textContent?.trim()).toBe('Total Projects');
    expect(statLabels[2].textContent?.trim()).toBe('Completed Tasks');
    expect(statLabels[3].textContent?.trim()).toBe('Performance');
  });

  it('should use signals for reactive data', () => {
    // Access the component's protected properties through type assertion
    const componentAny = component as any;
    
    expect(componentAny.title).toBeDefined();
    expect(componentAny.description).toBeDefined();
    expect(componentAny.stats).toBeDefined();
    
    // Verify signals return expected values
    expect(componentAny.title()).toBe('Dashboard');
    expect(componentAny.description()).toBe('Welcome to your Angular 20 Architecture Blueprint dashboard!');
    expect(componentAny.stats()).toHaveLength(4);
  });

  it('should be a presentation component without user interactions', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should not have any interactive elements
    expect(compiled.querySelectorAll('button')).toHaveLength(0);
    expect(compiled.querySelectorAll('input')).toHaveLength(0);
    expect(compiled.querySelectorAll('select')).toHaveLength(0);
    expect(compiled.querySelectorAll('a')).toHaveLength(0);
    
    // Should be purely informational
    expect(compiled.querySelector('h1')).toBeTruthy();
    expect(compiled.querySelectorAll('.stat-card')).toHaveLength(4);
  });

  it('should have semantic HTML structure', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    
    // Should have proper heading hierarchy
    const h1 = compiled.querySelector('h1');
    const h3Elements = compiled.querySelectorAll('h3');
    
    expect(h1).toBeTruthy();
    expect(h3Elements).toHaveLength(4); // One for each stat card
    
    // Each stat card should have h3 and p
    const statCards = compiled.querySelectorAll('.stat-card');
    statCards.forEach(card => {
      expect(card.querySelector('h3')).toBeTruthy();
      expect(card.querySelector('p')).toBeTruthy();
    });
  });
});