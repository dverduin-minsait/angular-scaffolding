import { render, screen } from '@testing-library/angular';
import { BreadcrumbComponent } from './breadcrumb.component';
import { provideRouter, Routes, Router } from '@angular/router';
import { Component } from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({ selector: 'home-cmp', standalone: true, template: 'Home' })
class HomeCmp {}
@Component({ selector: 'child-cmp', standalone: true, template: 'Child' })
class ChildCmp {}

const routes: Routes = [
  {
    path: 'home',
    component: HomeCmp,
    data: { breadcrumb: 'Home' },
    children: [
      { path: 'child', component: ChildCmp, data: { breadcrumb: 'Child Area' } }
    ]
  }
];

describe('BreadcrumbComponent', () => {
  it('renders breadcrumb trail with aria attributes', async () => {
    const { fixture } = await render(BreadcrumbComponent, {
      imports: [TranslateModule.forRoot({ fallbackLang: 'en' })],
      providers: [provideRouter(routes)],
    });
    // set minimal translations
    const translate = fixture.debugElement.injector.get(TranslateService);
    translate.setTranslation('en', { app: { breadcrumb: { home: 'Home'} } }, true);
    translate.use('en');
    const router = fixture.debugElement.injector.get(Router);
    await router.navigateByUrl('/home/child');
    fixture.detectChanges();

    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeTruthy();
  const listItems = nav.querySelectorAll('li');
  // Home + 2 dynamic = 3
  expect(listItems.length).toBe(3);
  expect(listItems[listItems.length - 1].classList).toContain('is-active');
  const current = nav.querySelector('[aria-current="page"]');
  expect(current?.textContent?.trim()).toBe('Child Area');
  });
});
