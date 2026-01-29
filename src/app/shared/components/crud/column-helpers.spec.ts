/**
 * Unit tests for CRUD column helper utilities
 * Following Angular testing patterns from AGENTS.md
 */

import {
  textColumn,
  numberColumn,
  priceColumn,
  dateColumn,
  booleanColumn,
  ratingColumn,
  percentageColumn,
  emailColumn,
  statusColumn,
  createColumns
} from './column-helpers';
import { CrudEntity } from './types';

interface TestEntity extends CrudEntity {
  name: string;
  age: number;
  price: number;
  birthDate: Date;
  active: boolean;
  rating: number;
  completion: number;
  email: string;
  status: string;
}

describe('Column Helpers', () => {
  describe('textColumn', () => {
    it('should create a basic text column with defaults', () => {
      const column = textColumn<TestEntity>('name', 'Name');
      
      expect(column.field).toBe('name');
      expect(column.headerName).toBe('Name');
      expect(column.flex).toBe(1);
      expect(column.minWidth).toBe(100);
      expect(column.visible).toBe(true);
    });

    it('should respect custom options', () => {
      const column = textColumn<TestEntity>('name', 'Name', {
        flex: 2,
        minWidth: 150,
        visible: false
      });
      
      expect(column.flex).toBe(2);
      expect(column.minWidth).toBe(150);
      expect(column.visible).toBe(false);
    });
  });

  describe('numberColumn', () => {
    it('should format numbers with specified decimals', () => {
      const column = numberColumn<TestEntity>('age', 'Age', 2);
      
      expect(column.field).toBe('age');
      expect(column.headerName).toBe('Age');
      expect(column.valueFormatter).toBeDefined();
      expect(column.valueFormatter!(25)).toBe('25.00');
      expect(column.valueFormatter!(25.567)).toBe('25.57');
    });

    it('should handle invalid numbers', () => {
      const column = numberColumn<TestEntity>('age', 'Age', 0);
      
      expect(column.valueFormatter!('invalid' as never)).toBe('');
      expect(column.valueFormatter!(NaN as never)).toBe('');
    });

    it('should default to 0 decimals', () => {
      const column = numberColumn<TestEntity>('age', 'Age');
      
      expect(column.valueFormatter!(42.789)).toBe('43');
    });
  });

  describe('priceColumn', () => {
    it('should format price with currency symbol', () => {
      const column = priceColumn<TestEntity>('price', 'Price', '$');
      
      expect(column.valueFormatter!(19.99)).toBe('$19.99');
      expect(column.valueFormatter!(100)).toBe('$100.00');
    });

    it('should apply cell styling for negative values', () => {
      const column = priceColumn<TestEntity>('price', 'Price', '$');
      
      const negativeStyle = column.cellStyle!(-50);
      expect(negativeStyle).toEqual({
        textAlign: 'right',
        fontWeight: '600',
        color: '#dc3545'
      });
      
      const positiveStyle = column.cellStyle!(50);
      expect(positiveStyle).toEqual({
        textAlign: 'right',
        fontWeight: '400',
        color: 'inherit'
      });
    });

    it('should support different currency symbols', () => {
      const column = priceColumn<TestEntity>('price', 'Price', '€');
      
      expect(column.valueFormatter!(25.50)).toBe('€25.50');
    });

    it('should handle invalid price values', () => {
      const column = priceColumn<TestEntity>('price', 'Price', '$');
      
      expect(column.valueFormatter!('invalid' as never)).toBe('');
    });
  });

  describe('dateColumn', () => {
    const testDate = new Date('2024-03-15');

    it('should format date in short format by default', () => {
      const column = dateColumn<TestEntity>('birthDate', 'Birth Date');
      
      const result = column.valueFormatter!(testDate);
      expect(result).toMatch(/3\/15\/2024|15\/3\/2024/); // locale-dependent
    });

    it('should format date in full format', () => {
      const column = dateColumn<TestEntity>('birthDate', 'Birth Date', 'full');
      
      const result = column.valueFormatter!(testDate);
      // Locale-agnostic check - just verify it contains year and is longer than short format
      expect(result).toContain('2024');
      expect(result.length).toBeGreaterThan(10); // Full format is longer
    });

    it('should format date as year only', () => {
      const column = dateColumn<TestEntity>('birthDate', 'Birth Date', 'year');
      
      expect(column.valueFormatter!(testDate)).toBe('2024');
    });

    it('should handle invalid dates', () => {
      const column = dateColumn<TestEntity>('birthDate', 'Birth Date');
      
      expect(column.valueFormatter!('invalid-date')).toBe('invalid-date');
      expect(column.valueFormatter!(null as never)).toBe('');
    });

    it('should handle date strings', () => {
      const column = dateColumn<TestEntity>('birthDate', 'Birth Date', 'year');
      
      expect(column.valueFormatter!('2024-03-15' as never)).toBe('2024');
    });
  });

  describe('booleanColumn', () => {
    it('should format boolean values with custom labels', () => {
      const column = booleanColumn<TestEntity>('active', 'Active', '✅ Yes', '❌ No');
      
      expect(column.valueFormatter!(true)).toBe('✅ Yes');
      expect(column.valueFormatter!(false)).toBe('❌ No');
    });

    it('should use default labels', () => {
      const column = booleanColumn<TestEntity>('active', 'Active');
      
      expect(column.valueFormatter!(true)).toBe('✅ Yes');
      expect(column.valueFormatter!(false)).toBe('❌ No');
    });

    it('should apply appropriate cell styling', () => {
      const column = booleanColumn<TestEntity>('active', 'Active');
      
      expect(column.cellStyle!(true)).toEqual({
        color: '#28a745',
        fontWeight: '600'
      });
      
      expect(column.cellStyle!(false)).toEqual({
        color: '#dc3545',
        fontWeight: '600'
      });
    });
  });

  describe('ratingColumn', () => {
    it('should format rating with star emoji', () => {
      const column = ratingColumn<TestEntity>('rating', 'Rating');
      
      expect(column.valueFormatter!(4.5)).toBe('⭐ 4.5');
      expect(column.valueFormatter!(3.0)).toBe('⭐ 3.0');
    });

    it('should apply color based on rating thresholds', () => {
      const column = ratingColumn<TestEntity>('rating', 'Rating', 5);
      
      // High rating (>= 4.0)
      const highStyle = column.cellStyle!(4.5);
      expect(highStyle?.['color']).toBe('#28a745');
      
      // Medium rating (>= 3.0)
      const medStyle = column.cellStyle!(3.5);
      expect(medStyle?.['color']).toBe('#ffc107');
      
      // Low rating (< 3.0)
      const lowStyle = column.cellStyle!(2.0);
      expect(lowStyle?.['color']).toBe('#dc3545');
    });

    it('should respect custom max rating', () => {
      const column = ratingColumn<TestEntity>('rating', 'Rating', 10);
      
      // For 10-star scale: 80% = 8.0, 60% = 6.0
      const highStyle = column.cellStyle!(8.5);
      expect(highStyle?.['color']).toBe('#28a745');
      
      const medStyle = column.cellStyle!(7.0);
      expect(medStyle?.['color']).toBe('#ffc107');
    });

    it('should handle invalid rating values', () => {
      const column = ratingColumn<TestEntity>('rating', 'Rating');
      
      expect(column.valueFormatter!('invalid' as never)).toBe('');
    });
  });

  describe('percentageColumn', () => {
    it('should format numbers as percentages', () => {
      const column = percentageColumn<TestEntity>('completion', 'Completion', 1);
      
      expect(column.valueFormatter!(75.5)).toBe('75.5%');
      expect(column.valueFormatter!(100)).toBe('100.0%');
    });

    it('should respect decimal places', () => {
      const column = percentageColumn<TestEntity>('completion', 'Completion', 2);
      
      expect(column.valueFormatter!(75.567)).toBe('75.57%');
    });

    it('should right-align text', () => {
      const column = percentageColumn<TestEntity>('completion', 'Completion');
      
      expect(column.cellStyle!(50)).toEqual({ textAlign: 'right' });
    });
  });

  describe('emailColumn', () => {
    it('should create email column with link styling', () => {
      const column = emailColumn<TestEntity>('email', 'Email');
      
      expect(column.field).toBe('email');
      expect(column.headerName).toBe('Email');
      expect(column.flex).toBe(1.5);
      expect(column.minWidth).toBe(150);
    });

    it('should apply mailto link styling', () => {
      const column = emailColumn<TestEntity>('email', 'Email');
      
      expect(column.cellStyle!('test@example.com' as never)).toEqual({
        color: '#0066cc',
        textDecoration: 'underline'
      });
    });
  });

  describe('statusColumn', () => {
    it('should format status with capitalization', () => {
      const column = statusColumn<TestEntity>('status', 'Status');
      
      expect(column.valueFormatter!('active')).toBe('Active');
      expect(column.valueFormatter!('PENDING')).toBe('Pending');
      expect(column.valueFormatter!('InActive')).toBe('Inactive');
    });

    it('should apply default colors for known statuses', () => {
      const column = statusColumn<TestEntity>('status', 'Status');
      
      expect(column.cellStyle!('active')?.['color']).toBe('#28a745');
      expect(column.cellStyle!('inactive')?.['color']).toBe('#6c757d');
      expect(column.cellStyle!('pending')?.['color']).toBe('#ffc107');
      expect(column.cellStyle!('error')?.['color']).toBe('#dc3545');
    });

    it('should allow custom status colors', () => {
      const column = statusColumn<TestEntity>('status', 'Status', {
        custom: '#ff00ff'
      });
      
      expect(column.cellStyle!('custom')?.['color']).toBe('#ff00ff');
    });

    it('should use default color for unknown statuses', () => {
      const column = statusColumn<TestEntity>('status', 'Status');
      
      expect(column.cellStyle!('unknown-status')?.['color']).toBe('#6c757d');
    });
  });

  describe('createColumns', () => {
    it('should create multiple columns with correct types', () => {
      const columns = createColumns<TestEntity>([
        { type: 'text', field: 'name', headerName: 'Name' },
        { type: 'number', field: 'age', headerName: 'Age' },
        { type: 'price', field: 'price', headerName: 'Price' },
        { type: 'boolean', field: 'active', headerName: 'Active' }
      ]);
      
      expect(columns).toHaveLength(4);
      expect(columns[0].field).toBe('name');
      expect(columns[1].field).toBe('age');
      expect(columns[2].field).toBe('price');
      expect(columns[3].field).toBe('active');
    });

    it('should apply custom options to all columns', () => {
      const columns = createColumns<TestEntity>([
        { 
          type: 'text', 
          field: 'name', 
          headerName: 'Name',
          options: { flex: 2, minWidth: 200, visible: false }
        }
      ]);
      
      expect(columns[0].flex).toBe(2);
      expect(columns[0].minWidth).toBe(200);
      expect(columns[0].visible).toBe(false);
    });

    it('should create all available column types', () => {
      const columns = createColumns<TestEntity>([
        { type: 'text', field: 'name', headerName: 'Name' },
        { type: 'number', field: 'age', headerName: 'Age' },
        { type: 'price', field: 'price', headerName: 'Price' },
        { type: 'date', field: 'birthDate', headerName: 'Birth Date' },
        { type: 'boolean', field: 'active', headerName: 'Active' },
        { type: 'rating', field: 'rating', headerName: 'Rating' },
        { type: 'percentage', field: 'completion', headerName: 'Completion' },
        { type: 'email', field: 'email', headerName: 'Email' },
        { type: 'status', field: 'status', headerName: 'Status' }
      ]);
      
      expect(columns).toHaveLength(9);
      expect(columns.every(col => col.field && col.headerName)).toBe(true);
    });
  });
});
