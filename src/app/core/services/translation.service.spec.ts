import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from './translation.service';
import { LOCAL_STORAGE } from '../tokens/local.storage.token';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

describe('TranslationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot({ fallbackLang: 'en' })
      ],
      providers: [
        provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
        TranslationService,
        { provide: LOCAL_STORAGE, useValue: localStorage }
      ]
    });
  });

  it('should initialize with default language', () => {
    const service = TestBed.inject(TranslationService);
    expect(service.currentLang()).toBeDefined();
  });

  it('should change language', () => {
    const service = TestBed.inject(TranslationService);
    service.use('es');
    expect(service.currentLang()).toBe('es');
  });
});
