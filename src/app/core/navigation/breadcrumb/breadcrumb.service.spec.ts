import { TestBed } from '@angular/core/testing';
import { BreadcrumbService } from './breadcrumb.service';
import { ActivatedRouteSnapshot, Router, Routes } from '@angular/router';
import { provideRouter } from '@angular/router';

/**
 * Minimal mock components (standalone) for route loading
 */
import { Component } from '@angular/core';
@Component({ selector: 'test-a', standalone: true, template: 'A' })
class AComponent {}
@Component({ selector: 'test-b', standalone: true, template: 'B' })
class BComponent {}

const routes: Routes = [
  {
    path: 'a',
    component: AComponent,
    data: { breadcrumb: 'Section A' },
    children: [
      {
        path: 'child',
        component: BComponent,
        data: { breadcrumb: (_r: ActivatedRouteSnapshot) => 'Dynamic Child' }
      }
    ]
  },
  { path: 'b', component: BComponent }
];

describe('BreadcrumbService', () => {
  let service: BreadcrumbService;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)]
    });
    service = TestBed.inject(BreadcrumbService);
    router = TestBed.inject(Router);
  });

  it('should build breadcrumbs for static label', async () => {
    await router.navigateByUrl('/a');
    const items = service.items();
    expect(items.length).toBe(1);
    expect(items[0].label).toBe('Section A');
  expect(items[0].url.endsWith('/a')).toBe(true);
  });

  it('should auto-generate label when no breadcrumb data', async () => {
    await router.navigateByUrl('/b');
    const items = service.items();
    expect(items[0].label).toBe('B');
  });

  it('should handle function breadcrumb', async () => {
    await router.navigateByUrl('/a/child');
    const items = service.items();
    expect(items.map(i => i.label)).toEqual(['Section A', 'Dynamic Child']);
  expect(items[1].isLast).toBe(true);
  });
});
