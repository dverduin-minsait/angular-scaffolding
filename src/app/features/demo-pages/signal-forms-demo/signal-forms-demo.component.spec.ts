import { provideZonelessChangeDetection } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SignalFormsDemoComponent } from './signal-forms-demo.component';

describe('SignalFormsDemoComponent', () => {
  async function setup(): Promise<void> {
    const { fixture } = await render(SignalFormsDemoComponent, {
      imports: [TranslateModule.forRoot({ fallbackLang: 'en' })],
      providers: [provideZonelessChangeDetection()]
    });

    const translate = fixture.debugElement.injector.get(TranslateService);
    translate.setTranslation(
      'en',
      {
        app: {
          homeSavings: {
            title: 'House Savings',
            form: {
              fields: {
                purchaseKind: {
                  label: 'Purchase type',
                  hint: 'Choose first-hand or second-hand',
                  options: {
                    firstHand: 'First-hand',
                    secondHand: 'Second-hand'
                  }
                },
                region: {
                  label: 'Region'
                },
                homePrice: {
                  label: 'Home price',
                  hint: 'Total purchase price'
                },
                commissionRate: {
                  label: 'Developer commission (%)'
                },
                realEstateCommissionRate: {
                  label: 'Real estate agency commission (%)',
                  hint: 'Only available for second-hand purchases.'
                },
                taxRate: {
                  ivaLabel: 'IVA rate (%)',
                  itpLabel: 'ITP rate (%)',
                  hint: 'Tax kind: {{kind}}'
                }
              }
            }
          }
        }
      },
      true
    );
    translate.use('en');
    fixture.detectChanges();
  }

  it('should create and render the title', async () => {
    await setup();
    const title = screen.getByRole('heading', { level: 1, name: 'House Savings' });
    expect(title).toBeTruthy();
  });

  it('toggles tax label and enables the right commission field by purchase kind', async () => {
    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: 'Second-hand' }));

    expect(screen.getByText('ITP rate (%)')).toBeTruthy();
    expect((screen.getByLabelText('Developer commission (%)') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Real estate agency commission (%)') as HTMLInputElement).disabled).toBe(false);
  });

  it('remembers real estate agency commission when toggling purchase kind', async () => {
    await setup();
    const user = userEvent.setup();

    await user.click(screen.getByRole('radio', { name: 'Second-hand' }));

    const agencyCommission = screen.getByLabelText('Real estate agency commission (%)');
    await user.clear(agencyCommission);
    await user.type(agencyCommission, '4.5');

    await user.click(screen.getByRole('radio', { name: 'First-hand' }));
    expect((screen.getByLabelText('Real estate agency commission (%)') as HTMLInputElement).disabled).toBe(true);

    await user.click(screen.getByRole('radio', { name: 'Second-hand' }));
    expect((screen.getByLabelText('Real estate agency commission (%)') as HTMLInputElement).value).toBe('4.5');
  });

  it('remembers commission values when toggling purchase kind', async () => {
    await setup();
    const user = userEvent.setup();

    const developerCommission = screen.getByLabelText('Developer commission (%)');

    await user.clear(developerCommission);
    await user.type(developerCommission, '2.25');

    await user.click(screen.getByRole('radio', { name: 'Second-hand' }));
    expect((screen.getByLabelText('Developer commission (%)') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Developer commission (%)') as HTMLInputElement).value).toBe('2.25');

    await user.click(screen.getByRole('radio', { name: 'First-hand' }));
    expect((screen.getByLabelText('Developer commission (%)') as HTMLInputElement).disabled).toBe(false);
    expect((screen.getByLabelText('Developer commission (%)') as HTMLInputElement).value).toBe('2.25');
  });

  it('allows overriding taxRate and keeps it until purchase kind changes', async () => {
    await setup();
    const user = userEvent.setup();

    const taxRate = screen.getByLabelText('IVA rate (%)');
    await user.clear(taxRate);
    await user.type(taxRate, '15');
    expect((screen.getByLabelText('IVA rate (%)') as HTMLInputElement).value).toBe('15');

    const homePrice = screen.getByLabelText('Home price');
    await user.clear(homePrice);
    await user.type(homePrice, '300000');
    expect((screen.getByLabelText('IVA rate (%)') as HTMLInputElement).value).toBe('15');

    await user.click(screen.getByRole('radio', { name: 'Second-hand' }));
    expect(screen.getByText('ITP rate (%)')).toBeTruthy();
    expect((screen.getByLabelText('ITP rate (%)') as HTMLInputElement).value).toBe('6');

    await user.click(screen.getByRole('radio', { name: 'First-hand' }));
    expect(screen.getByText('IVA rate (%)')).toBeTruthy();
    expect((screen.getByLabelText('IVA rate (%)') as HTMLInputElement).value).toBe('10');
  });

  it('does not render removed extra fields', async () => {
    await setup();
    expect(screen.queryByLabelText(/buyer email/i)).toBeNull();
    expect(screen.queryByLabelText(/postal code/i)).toBeNull();
    expect(screen.queryByLabelText(/notes/i)).toBeNull();
  });
});
