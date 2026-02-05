import { Component, signal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { expectAccessibleForm } from '../../../../testing/axe-testing';
import { SelectMultipleComponent, type SelectMultipleChangeEvent, type SelectMultipleSearchEvent } from './select-multiple.component';
import { FormField, form, validate, type SchemaFn } from '@angular/forms/signals';

interface Item {
  id: string;
  description: string;
  name?: string;
}

@Component({
  standalone: true,
  imports: [SelectMultipleComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <app-select-multiple
        controlId="test-multi"
        ariaLabel="Test multi"
        [items]="items()"
        [searchBar]="searchBar()"
        [searchBarKeyName]="searchKey()"
        [showSelectAll]="showSelectAll()"
        [showSelectNone]="showSelectNone()"
        [columnDisplay]="columnDisplay()"
        formControlName="value"
        (opened)="openedCount.set(openedCount() + 1)"
        (closed)="closedCount.set(closedCount() + 1)"
        (valueChange)="handleValueChange($event)"
        (searchTermChange)="handleSearch($event)"
        (selectAllTriggered)="selectAllCount.set(selectAllCount() + 1)"
        (selectNoneTriggered)="selectNoneCount.set(selectNoneCount() + 1)"
        [onChange]="onChangeFn"
        [onSearch]="onSearchFn"
        [onOpen]="onOpenFn"
        [onClose]="onCloseFn"
        [onSelectAll]="onSelectAllFn"
        [onSelectNone]="onSelectNoneFn" />
    </form>
  `
})
class HostReactiveFormComponent {
  readonly items = signal<readonly Item[]>([
    { id: 'a', description: 'Alpha', name: 'first' },
    { id: 'b', description: 'Beta', name: 'second' },
    { id: 'c', description: 'Gamma', name: 'third' }
  ]);

  readonly searchBar = signal(false);
  readonly searchKey = signal<string | null>(null);
  readonly showSelectAll = signal(false);
  readonly showSelectNone = signal(false);
  readonly columnDisplay = signal<'single' | 'multi'>('single');

  readonly openedCount = signal(0);
  readonly closedCount = signal(0);
  readonly selectAllCount = signal(0);
  readonly selectNoneCount = signal(0);

  readonly valueEvents: SelectMultipleChangeEvent[] = [];
  readonly searchEvents: SelectMultipleSearchEvent[] = [];

  readonly onChangeFn = vi.fn();
  readonly onSearchFn = vi.fn();
  readonly onOpenFn = vi.fn();
  readonly onCloseFn = vi.fn();
  readonly onSelectAllFn = vi.fn();
  readonly onSelectNoneFn = vi.fn();

  readonly form = new FormGroup({
    value: new FormControl<readonly string[]>(['b'], { nonNullable: true })
  });

  handleValueChange(event: SelectMultipleChangeEvent): void {
    this.valueEvents.push(event);
  }

  handleSearch(event: SelectMultipleSearchEvent): void {
    this.searchEvents.push(event);
  }
}

@Component({
  standalone: true,
  imports: [SelectMultipleComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <app-select-multiple
        controlId="tab-test"
        ariaLabel="Tab test"
        [items]="items"
        [searchBar]="true"
        [showSelectAll]="true"
        [showSelectNone]="true"
        formControlName="value" />
      <button type="button">After</button>
    </form>
  `
})
class HostTabNavigationComponent {
  readonly items = [
    { id: 'a', description: 'Alpha' },
    { id: 'b', description: 'Beta' },
    { id: 'c', description: 'Gamma' }
  ];

  readonly form = new FormGroup({
    value: new FormControl<readonly string[]>([], { nonNullable: true })
  });
}

@Component({
  standalone: true,
  imports: [SelectMultipleComponent, ReactiveFormsModule],
  template: `
    <form [formGroup]="form">
      <app-select-multiple
        ariaLabel="Custom keys"
        [items]="items"
        idKey="code"
        descriptionKey="label"
        formControlName="value" />
    </form>
  `
})
class HostCustomKeysComponent {
  readonly items = [
    { code: 10, label: 'Ten' },
    { code: 20, label: 'Twenty' }
  ] as const;

  readonly form = new FormGroup({
    value: new FormControl<readonly number[]>([20], { nonNullable: true })
  });
}

interface SignalFormsModel {
  compare: readonly string[];
}

@Component({
  standalone: true,
  imports: [SelectMultipleComponent, FormField],
  template: `
    <app-select-multiple
      ariaLabel="Signal forms"
      [items]="items"
      [formField]="compareForm.compare" />
  `
})
class HostSignalFormsComponent {
  readonly items = [
    { id: 'a', description: 'Alpha' },
    { id: 'b', description: 'Beta' }
  ];

  readonly model = signal<SignalFormsModel>({ compare: ['a'] });

  private readonly schema: SchemaFn<SignalFormsModel> = p => {
    validate(p.compare, () => undefined);
  };

  readonly compareForm = form(this.model, this.schema);
}

describe('SelectMultipleComponent', () => {
  it('renders selected items in the trigger (CVA initial value)', async () => {
    await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    expect(screen.getByRole('button', { name: 'Test multi' })).toHaveTextContent('Beta');
  });

  it('updates the bound form control when selecting items', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    await user.click(screen.getByRole('button', { name: 'Test multi' }));
    await user.click(screen.getByRole('option', { name: 'Alpha' }));

    const host = fixture.componentInstance;
    expect(host.form.controls.value.value).toEqual(['b', 'a']);
    expect(host.valueEvents.at(-1)?.value).toEqual(['b', 'a']);
    expect(host.onChangeFn).toHaveBeenCalled();
  });

  it('supports Tab/Shift+Tab navigation into and out of the panel', async () => {
    const user = userEvent.setup();
    await render(HostTabNavigationComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    await user.tab();
    expect(screen.getByRole('button', { name: 'Tab test' })).toHaveFocus();

    await user.keyboard('{Enter}');
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus());

    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'None' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
  });

  it('supports arrow-key navigation through options', async () => {
    const user = userEvent.setup();
    await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    const trigger = screen.getByRole('button', { name: 'Test multi' });
    trigger.focus();
    await user.keyboard('{Enter}');

    await waitFor(() => expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus());

    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: 'Beta' })).toHaveFocus();

    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: 'Alpha' })).toHaveFocus();

    await user.keyboard('{End}');
    expect(screen.getByRole('option', { name: 'Gamma' })).toHaveFocus();
  });

  it('exposes key ARIA attributes (expanded/controls/selected)', async () => {
    const user = userEvent.setup();
    await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    const trigger = screen.getByRole('button', { name: 'Test multi' });
    expect(trigger.getAttribute('aria-haspopup')).toBe('listbox');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe('test-multi-listbox');

    await user.click(screen.getByRole('option', { name: 'Alpha' }));
    expect(screen.getByRole('option', { name: 'Alpha' }).getAttribute('aria-selected')).toBe('true');
  });

  it('closes on Escape and fires opened/closed events', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    await user.click(screen.getByRole('button', { name: 'Test multi' }));
    await user.keyboard('{Escape}');

    const host = fixture.componentInstance;
    expect(host.openedCount()).toBe(1);
    expect(host.closedCount()).toBe(1);
    expect(host.onOpenFn).toHaveBeenCalledTimes(1);
    expect(host.onCloseFn).toHaveBeenCalledTimes(1);
  });

  it('filters items using the search bar (description by default, overrideable)', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    const host = fixture.componentInstance;
    host.searchBar.set(true);
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: 'Test multi' }));

    const search = screen.getByRole('textbox', { name: 'Search' });
    await user.type(search, 'ga');

    expect(screen.queryByRole('option', { name: 'Alpha' })).toBeNull();
    expect(screen.getByRole('option', { name: 'Gamma' })).toBeTruthy();

    host.searchKey.set('name');
    fixture.detectChanges();

    await user.clear(search);
    await user.type(search, 'second');
    expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy();
    expect(host.searchEvents.length).toBeGreaterThan(0);
    expect(host.onSearchFn).toHaveBeenCalled();
  });

  it('supports select all and none actions', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    const host = fixture.componentInstance;
    host.showSelectAll.set(true);
    host.showSelectNone.set(true);
    fixture.detectChanges();

    await user.click(screen.getByRole('button', { name: 'Test multi' }));
    await user.click(screen.getByRole('button', { name: 'Select all' }));

    expect(host.form.controls.value.value).toEqual(['a', 'b', 'c']);
    expect(host.selectAllCount()).toBe(1);
    expect(host.onSelectAllFn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: 'None' }));
    expect(host.form.controls.value.value).toEqual([]);
    expect(host.selectNoneCount()).toBe(1);
    expect(host.onSelectNoneFn).toHaveBeenCalledTimes(1);
  });

  it('applies multi-column mode class when requested', async () => {
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    const host = fixture.componentInstance;
    host.columnDisplay.set('multi');
    fixture.detectChanges();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Test multi' }));

    const listbox = screen.getByRole('listbox', { name: 'Test multi' });
    expect(listbox.classList.contains('select-multiple__list--multi')).toBe(true);
  });

  it('has no obvious form accessibility violations', async () => {
    const { fixture } = await render(HostReactiveFormComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    await expectAccessibleForm(fixture);
  });

  it('supports overriding idKey and descriptionKey', async () => {
    await render(HostCustomKeysComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    expect(screen.getByRole('button', { name: 'Custom keys' })).toHaveTextContent('Twenty');
  });

  it('works with Angular Signal Forms via FormField binding', async () => {
    const user = userEvent.setup();
    const { fixture } = await render(HostSignalFormsComponent, {
      providers: [provideZonelessChangeDetection()]
    });

    await user.click(screen.getByRole('button', { name: 'Signal forms' }));
    await user.click(screen.getByRole('option', { name: 'Beta' }));

    const host = fixture.componentInstance;
    expect(host.model().compare).toEqual(['a', 'b']);
  });
});
