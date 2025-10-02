import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header/header.component';
import { BreadcrumbComponent } from './core/navigation/breadcrumb';
import { localStorageProvider } from './core/tokens/local.storage.token';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, BreadcrumbComponent],
  providers: [
    localStorageProvider
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('angular-architecture');
}
