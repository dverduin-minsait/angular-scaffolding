import { InjectionToken, Pipe, PipeTransform, Inject, inject } from '@angular/core';
import { TranslationService } from '../core/services/translation.service';

/** Default stub translation map used in unit tests. */
export const DEFAULT_TEST_TRANSLATIONS: Record<string, string> = {
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
  'app.actions.toggleTheme': 'Switch theme',
  'app.actions.openMenu': 'Open menu',
  'app.actions.closeMenu': 'Close menu',
  'app.actions.changeLanguage': 'Change language'
};

/** Injection token to supply a translation key/value map to the stub pipe + service. */
export const STUB_TRANSLATIONS = new InjectionToken<Record<string, string>>('STUB_TRANSLATIONS');

/**
 * Standalone stub pipe that mimics the external TranslatePipe but performs a
 * simple synchronous lookup into an injected translations map.
 */
@Pipe({ name: 'translate', standalone: true })
export class TranslateStubPipe implements PipeTransform {
  private readonly map: Record<string,string>;
  constructor(@Inject(STUB_TRANSLATIONS) provided?: Record<string,string>) {
    this.map = provided ?? DEFAULT_TEST_TRANSLATIONS;
  }
  transform(value: string, _params?: any): string {
    return this.map[value] ?? value;
  }
}

/** Factory to build a light stub for TranslationService. */
function buildTranslationService(map: Record<string, string>): Partial<TranslationService> {
  return {
    currentLang: () => 'en',
    availableLangs: ['en','es','pt','ca','gl'],
    use: () => Promise.resolve(),
    instant: (key: string, _params?: Record<string, any>) => map[key] ?? key,
    translations: () => map
  } as any;
}

/**
 * Provide a merged translations map (default + overrides) and a mocked TranslationService.
 * Usage: providers: [...provideStubTranslationService({ 'app.title': 'My Title' })]
 */
export function provideStubTranslationService(overrides?: Record<string,string>) {
  const merged = { ...DEFAULT_TEST_TRANSLATIONS, ...(overrides || {}) };
  return [
    { provide: STUB_TRANSLATIONS, useValue: merged },
    { provide: TranslationService, useFactory: () => buildTranslationService(merged) }
  ];
}
