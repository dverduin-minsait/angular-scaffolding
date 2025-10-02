import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE, StorageService } from '../tokens/local.storage.token';

export type SupportedLang = 'en' | 'es' | 'pt' | 'ca' | 'gl';

const DEFAULT_LANG: SupportedLang = 'es';
const STORAGE_KEY = 'app.language';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly translate = inject(TranslateService, { optional: true });
  private readonly storage = inject<StorageService>(LOCAL_STORAGE);

  private readonly currentLangSignal = signal<SupportedLang>(DEFAULT_LANG);

  readonly currentLang = computed(() => this.currentLangSignal());
  readonly availableLangs: readonly SupportedLang[] = ['en', 'es', 'pt', 'ca', 'gl'];

  constructor() {
    this.translate?.addLangs(this.availableLangs as string[]);
    const stored = (this.storage.getItem(STORAGE_KEY) as SupportedLang | null);
    const browser = (this.translate?.getBrowserLang() as SupportedLang | undefined);
    const initial = stored && this.availableLangs.includes(stored) ? stored : (browser && this.availableLangs.includes(browser) ? browser : DEFAULT_LANG);
    this.use(initial);
  }

  async use(lang: SupportedLang) {
    if (lang === this.currentLangSignal()) return;
    if (!this.availableLangs.includes(lang)) return;
    this.currentLangSignal.set(lang);
    await this.translate?.use(lang);
    this.storage.setItem(STORAGE_KEY, lang);
    // Update html lang attribute for a11y
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  instant(key: string, interpolateParams?: Record<string, any>): string {
    return this.translate?.instant(key, interpolateParams) ?? key;
  }
}
