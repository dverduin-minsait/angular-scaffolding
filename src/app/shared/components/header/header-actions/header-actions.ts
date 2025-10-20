import { Component, inject, input, output, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeService } from '../../../../core/services/theme.service';
import { TranslationService, SupportedLang } from '../../../../core/services/translation.service';

@Component({
  selector: 'app-header-actions',
  imports: [CommonModule, TranslatePipe],
  templateUrl: './header-actions.html',
  styleUrl: './header-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderActions {
  protected readonly themeService = inject(ThemeService);
  protected readonly i18n = inject(TranslationService);

  // Inputs for state
  readonly sidebarOpen = input.required<boolean>();

  // Outputs for actions
  readonly sidebarToggle = output<void>();

  // Computed values to avoid repeated calculations
  protected readonly themeIcon = computed(() => this.themeService.getThemeIcon());
  protected readonly isDarkMode = computed(() => this.themeService.isDarkMode());
  
  // Memoized aria-labels to prevent string concatenation on each render
  protected readonly themeAriaLabel = computed(() => {
    this.i18n.currentLang(); // trigger re-computation on language change
    return this.i18n.instant('app.actions.toggleTheme', { theme: this.isDarkMode() ? 'light' : 'dark' });
  });
  
  protected readonly burgerAriaLabel = computed(() => {
    this.i18n.currentLang(); // trigger re-computation on language change
    return this.sidebarOpen() ? this.i18n.instant('app.actions.closeMenu') : this.i18n.instant('app.actions.openMenu');
  });

  // Language selection
  protected readonly languages = this.i18n.availableLangs;

  protected onLanguageChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as SupportedLang;
    // Fire and forget; underlying service handles persistence & html lang
    this.i18n.use(value);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  protected toggleSidebar(): void {
    this.sidebarToggle.emit();
  }
}
