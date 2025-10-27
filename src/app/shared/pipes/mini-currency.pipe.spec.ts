import { MiniCurrencyPipe } from './mini-currency.pipe';

describe('MiniCurrencyPipe', () => {
  let pipe: MiniCurrencyPipe;

  beforeEach(() => {
    pipe = new MiniCurrencyPipe();
  });

  describe('transform', () => {
    it('should create an instance', () => {
      expect(pipe).toBeTruthy();
    });

    it('should format a valid number with default parameters', () => {
      expect(pipe.transform(100)).toBe('$100.00');
    });

    it('should format a valid number with custom currency symbol', () => {
      expect(pipe.transform(100, '€')).toBe('€100.00');
    });

    it('should format a valid number with custom fraction digits', () => {
      expect(pipe.transform(100.123, '$', 3)).toBe('$100.123');
    });

    it('should format a valid number with custom currency symbol and fraction digits', () => {
      expect(pipe.transform(50.5, '£', 1)).toBe('£50.5');
    });

    it('should format zero correctly', () => {
      expect(pipe.transform(0)).toBe('$0.00');
    });

    it('should format negative numbers correctly', () => {
      expect(pipe.transform(-25.75)).toBe('$-25.75');
    });

    it('should format very small numbers correctly', () => {
      expect(pipe.transform(0.01, '$', 2)).toBe('$0.01');
    });

    it('should format large numbers correctly', () => {
      expect(pipe.transform(999999.99)).toBe('$999999.99');
    });

    it('should parse and format a valid numeric string', () => {
      expect(pipe.transform('100')).toBe('$100.00');
    });

    it('should parse and format a valid numeric string with decimals', () => {
      expect(pipe.transform('123.456', '$', 2)).toBe('$123.46');
    });

    it('should parse and format a negative numeric string', () => {
      expect(pipe.transform('-50.25')).toBe('$-50.25');
    });

    it('should handle numeric string with custom currency', () => {
      expect(pipe.transform('75', '¥')).toBe('¥75.00');
    });

    it('should return default value for invalid string', () => {
      expect(pipe.transform('invalid')).toBe('$0.00');
    });

    it('should return default value for null', () => {
      expect(pipe.transform(null)).toBe('$0.00');
    });

    it('should return default value for undefined', () => {
      expect(pipe.transform(undefined)).toBe('$0.00');
    });

    it('should return default value for empty string', () => {
      expect(pipe.transform('')).toBe('$0.00');
    });

    it('should return default value with custom currency for invalid input', () => {
      expect(pipe.transform('abc', '€')).toBe('€0.00');
    });

    it('should return default value with custom fraction digits for invalid input', () => {
      expect(pipe.transform(null, '$', 3)).toBe('$0.000');
    });

    it('should handle NaN correctly', () => {
      expect(pipe.transform(NaN)).toBe('$0.00');
    });

    it('should handle objects correctly', () => {
      expect(pipe.transform({})).toBe('$0.00');
    });

    it('should handle arrays correctly', () => {
      expect(pipe.transform([])).toBe('$0.00');
    });

    it('should handle boolean values correctly', () => {
      expect(pipe.transform(true)).toBe('$1.00');
      expect(pipe.transform(false)).toBe('$0.00');
    });

    it('should format with zero fraction digits', () => {
      expect(pipe.transform(123.456, '$', 0)).toBe('$123');
    });

    it('should format with high fraction digits', () => {
      expect(pipe.transform(1.23456789, '$', 5)).toBe('$1.23457');
    });
  });
});
