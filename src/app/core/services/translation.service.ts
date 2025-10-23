import { computed, inject, Injectable, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { LOCAL_STORAGE, StorageService } from '../tokens/local.storage.token';
import { firstValueFrom } from 'rxjs';

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

  public readonly translations = signal<Record<string, string>>({});

  constructor() {
    this.translate?.addLangs(this.availableLangs as string[]);
    const stored = (this.storage.getItem(STORAGE_KEY) as SupportedLang | null);
    const browser = (this.translate?.getBrowserLang() as SupportedLang | undefined);
    const initial = stored && this.availableLangs.includes(stored) ? stored : (browser && this.availableLangs.includes(browser) ? browser : DEFAULT_LANG);
    // Initialize language asynchronously
    void this.initializeLanguage(initial);
  }

  private async initializeLanguage(lang: SupportedLang): Promise<void> {
    await this.use(lang);
  }

  async use(lang: SupportedLang): Promise<void> {
    if (lang === this.currentLangSignal()) return;
    if (!this.availableLangs.includes(lang)) return;
    this.currentLangSignal.set(lang);
    // Ensure we properly await the observable returned by ngx-translate (use returns an Observable)
    if (this.translate) {
      console.log(`TranslationService: switching to lang ${lang}`);
      await firstValueFrom(this.translate.use(lang));
      // Force load (and await) the 'app' namespace so downstream computeds see updated values
      const res = await firstValueFrom(this.translate.get('app')) as Record<string, string>;
      this.translations.set(res);
    }
    this.storage.setItem(STORAGE_KEY, lang);
    // Update html lang attribute for a11y
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }

  instant(key: string, interpolateParams?: Record<string, unknown>): string {
    return this.translate?.instant(key, interpolateParams) as string ?? key;
  }
}
