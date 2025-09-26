import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'miniCurrency',
  standalone: true,
  pure: true
})
export class MiniCurrencyPipe implements PipeTransform {
  transform(value: unknown, currencySymbol: string = '$', fractionDigits: number = 2): string {
    if (typeof value === 'number' && !isNaN(value)) {
      return currencySymbol + value.toFixed(fractionDigits);
    }
    const parsed = Number(value);
    if (!isNaN(parsed)) {
      return currencySymbol + parsed.toFixed(fractionDigits);
    }
    return currencySymbol + '0.00';
  }
}
