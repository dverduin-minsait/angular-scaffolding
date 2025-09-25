// =============================================================================
// API INTEGRATION EXAMPLES: ABSTRACT CLASS vs FUNCTIONAL COMPOSITION vs RESOURCE SIGNALS
// =============================================================================

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// Import all three approaches
import { ClothesApiService } from './abstract-api-service.example';
import { ClothesFunctionalApiService, useClothesApi } from './functional-composition.example';
import { ClothesResourceService } from './resource-signal.example';

// Import theme service for styling
import { ThemeService } from '../../services/theme.service';

/**
 * COMPARISON SUMMARY:
 * 
 * ABSTRACT CLASS APPROACH:
 * ✅ Familiar OOP pattern, consistent implementation, easy inheritance
 * ⚠️ Larger bundle size, inheritance coupling, less flexible
 * 
 * FUNCTIONAL COMPOSITION APPROACH:
 * ✅ Tree-shakable, flexible, easier testing, better performance
 * ⚠️ Less familiar, requires discipline, manual composition
 * 
 * RESOURCE SIGNAL APPROACH (RxJS Interop):
 * ✅ Reactive by design, automatic loading states, clean signal API
 * ⚠️ More setup required, dependency on RxJS interop, newer pattern
 */

@Component({
  selector: 'app-api-comparison',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="api-comparison">
      <h2>API Integration Comparison</h2>
      
      <!-- Abstract Class Example -->
      <section class="abstract-example">
        <h3>Abstract Class Approach</h3>
        <div class="status">
          <p>Loading: {{ abstractService.loading().isLoading ? 'Yes' : 'No' }}</p>
          <p>Items Count: {{ abstractService.items().length }}</p>
          <p>Has Error: {{ abstractService.error() ? 'Yes' : 'No' }}</p>
          <p>Is Ready: {{ abstractService.isReady() ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="actions">
          <button (click)="loadAbstractData()" [disabled]="abstractService.loading().isLoading">
            <span *ngIf="abstractService.loading().isLoading" class="loading-indicator"></span>
            {{ abstractService.loading().isLoading ? 'Loading...' : 'Load Data (Abstract)' }}
          </button>
          <button (click)="clearAbstractData()">Clear</button>
          <button (click)="testAbstractOperations()" [disabled]="abstractService.loading().isLoading">
            Test CRUD Operations
          </button>
        </div>

        <div class="computed-values" *ngIf="abstractService.hasData()">
          <p><strong>📊 Computed Statistics:</strong></p>
          <p>Available Items: <span class="success-text">{{ abstractService.availableItems().length }}</span></p>
          <p>Low Stock Items: <span class="warning-text">{{ abstractService.lowStockItems().length }}</span></p>
          <p>Total Value: <strong>{{ formatCurrency(abstractService.totalValue()) }}</strong></p>
        </div>

        <div class="error-message" *ngIf="abstractService.error()">
          <strong>❌ Error:</strong> {{ abstractService.error()?.message }}
        </div>
      </section>

      <!-- Functional Composition Example -->
      <section class="functional-example">
        <h3>Functional Composition Approach</h3>
        <div class="status">
          <p>Loading: {{ functionalService.loading().isLoading ? 'Yes' : 'No' }}</p>
          <p>Items Count: {{ functionalService.items().length }}</p>
          <p>Has Error: {{ functionalService.error() ? 'Yes' : 'No' }}</p>
          <p>Is Ready: {{ functionalService.isReady() ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="actions">
          <button (click)="loadFunctionalData()" [disabled]="functionalService.loading().isLoading">
            Load Data (Functional)
          </button>
          <button (click)="clearFunctionalData()">Clear</button>
        </div>

        <div class="computed-values" *ngIf="functionalService.hasData()">
          <p>Available Items: {{ functionalService.availableItems().length }}</p>
          <p>Low Stock Items: {{ functionalService.lowStockItems().length }}</p>
          <p>Total Value: {{ formatCurrency(functionalService.totalValue()) }}</p>
        </div>
      </section>

      <!-- Pure Functional Example -->
      <section class="pure-functional-example">
        <h3>Pure Functional Approach (useClothesApi)</h3>
        <div class="status">
          <p>Loading: {{ pureApi.loading().isLoading ? 'Yes' : 'No' }}</p>
          <p>Items Count: {{ pureApi.items().length }}</p>
          <p>Has Error: {{ pureApi.error() ? 'Yes' : 'No' }}</p>
          <p>Is Ready: {{ pureApi.isReady() ? 'Yes' : 'No' }}</p>
        </div>
        
        <div class="actions">
          <button (click)="loadPureData()" [disabled]="pureApi.loading().isLoading">
            Load Data (Pure Functional)
          </button>
          <button (click)="clearPureData()">Clear</button>
        </div>
      </section>

      <!-- Resource Signal Example -->
      <section class="resource-signal-example">
        <h3>Resource Signal Approach (RxJS Interop)</h3>
        <div class="status">
          <p>Loading: {{ resourceService.isLoading() ? 'Yes' : 'No' }}</p>
          <p>Items Count: {{ resourceService.items().length }}</p>
          <p>Has Error: {{ resourceService.hasError() ? 'Yes' : 'No' }}</p>
          <p>Current Operation: {{ resourceService.currentOperation() }}</p>
        </div>
        
        <div class="actions">
          <button (click)="loadResourceData()" [disabled]="resourceService.isLoading()">
            <span *ngIf="resourceService.isLoading()" class="loading-indicator"></span>
            {{ resourceService.isLoading() ? 'Loading...' : 'Load Data (Resource Signal)' }}
          </button>
          <button (click)="clearResourceData()">Clear</button>
          <button (click)="testResourceOperations()" [disabled]="resourceService.isLoading()">
            Test CRUD Operations
          </button>
        </div>

        <div class="computed-values" *ngIf="resourceService.hasItems()">
          <p><strong>📊 Resource Statistics:</strong></p>
          <p>Available Items: <span class="success-text">{{ resourceService.availableItems().length }}</span></p>
          <p>Low Stock Items: <span class="warning-text">{{ resourceService.lowStockItems().length }}</span></p>
          <p>Total Value: <strong>{{ formatCurrency(resourceService.totalValue()) }}</strong></p>
          <p>Average Price: {{ formatCurrency(resourceService.averagePrice()) }}</p>
          <p>Stock Summary: Available {{ resourceService.stockSummary().available }}/{{ resourceService.stockSummary().total }}</p>
        </div>

        <div class="error-message" *ngIf="resourceService.hasError()">
          <strong>❌ Error:</strong> {{ resourceService.error()?.message }}
        </div>
      </section>
    </div>
  `,
  styles: [`
    .api-comparison {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      color: var(--text-primary, #333);
      background: var(--background-primary, #fafafa);
      min-height: calc(100vh - 40px);
    }

    section {
      margin: 20px 0;
      padding: 20px;
      border: 2px solid var(--border-color, #e0e0e0);
      border-radius: 12px;
      background: var(--surface-color, #ffffff);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    section:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
    }

    .status, .computed-values {
      background: var(--background-secondary, #f8f9fa);
      border: 1px solid var(--border-light, #dee2e6);
      padding: 15px;
      border-radius: 8px;
      margin: 10px 0;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    }

    .actions {
      margin: 15px 0;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    button {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--accent-color, #007acc);
      color: var(--button-text, white);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    button:disabled {
      background: var(--disabled-color, #6c757d);
      cursor: not-allowed;
      opacity: 0.6;
    }

    button:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      background: var(--accent-hover, #005a9e);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    h2 {
      text-align: center;
      color: var(--text-primary, #2c3e50);
      font-size: 2rem;
      margin-bottom: 2rem;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    h3 {
      color: var(--accent-color, #007acc);
      border-bottom: 3px solid var(--accent-color, #007acc);
      padding-bottom: 8px;
      margin-bottom: 1rem;
      font-size: 1.4rem;
      font-weight: 600;
    }

    p {
      margin: 8px 0;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
      font-size: 14px;
      color: var(--text-secondary, #495057);
      line-height: 1.4;
    }

    .abstract-example {
      border-left: 5px solid var(--success-color, #28a745);
    }

    .functional-example {
      border-left: 5px solid var(--info-color, #17a2b8);
    }

    .pure-functional-example {
      border-left: 5px solid var(--warning-color, #ffc107);
    }

    .resource-signal-example {
      border-left: 5px solid var(--purple-color, #6f42c1);
    }

    .success-text {
      color: var(--success-color, #28a745);
      font-weight: 600;
    }

    .warning-text {
      color: var(--warning-color, #ffc107);
      font-weight: 600;
    }

    .loading-indicator {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--accent-color, #007acc);
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background: var(--error-background, #f8d7da);
      color: var(--error-color, #721c24);
      border: 1px solid var(--error-border, #f5c6cb);
      padding: 12px;
      border-radius: 6px;
      margin: 10px 0;
    }

    .success-message {
      background: var(--success-background, #d4edda);
      color: var(--success-color, #155724);
      border: 1px solid var(--success-border, #c3e6cb);
      padding: 12px;
      border-radius: 6px;
      margin: 10px 0;
    }

    @media (max-width: 768px) {
      .api-comparison {
        padding: 15px;
      }
      
      section {
        padding: 15px;
      }
      
      .actions {
        flex-direction: column;
      }
      
      button {
        width: 100%;
      }
    }
  `]
})
export class ApiComparisonComponent implements OnInit {
  
  // Abstract class approach
  readonly abstractService = inject(ClothesApiService);
  
  // Functional composition approach (service-based)
  readonly functionalService = inject(ClothesFunctionalApiService);
  
  // Resource signal approach (RxJS interop)
  readonly resourceService = inject(ClothesResourceService);
  
  // Pure functional approach (direct composition)
  readonly pureApi = useClothesApi();

  // Theme service for dynamic styling
  readonly themeService = inject(ThemeService);

  ngOnInit() {
    console.log('🚀 API Comparison Component Initialized');
    console.log('🎨 Current theme:', this.themeService.currentTheme());
    console.log('🌙 Dark mode:', this.themeService.isDarkMode());
  }

  // Abstract class methods
  loadAbstractData() {
    console.log('🔄 Loading data with Abstract Class approach...');
    this.abstractService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Abstract data loaded:', data.length, 'items');
        console.log('📊 Sample item:', data[0]);
      },
      error: (error) => {
        console.error('❌ Abstract data error:', error);
      }
    });
  }

  clearAbstractData() {
    this.abstractService.clear();
    console.log('🧹 Abstract service cleared');
  }

  testAbstractOperations() {
    console.log('🧪 Testing Abstract CRUD operations...');
    
    // Test creating a new item
    const newItem = {
      name: 'Test API Item',
      brand: 'TestBrand',
      price: 99.99,
      size: 'M',
      color: 'blue',
      stock: 10,
      season: 'Spring',
      category: 'Test',
      description: 'Created via Abstract API',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.abstractService.create(newItem).subscribe({
      next: (created) => {
        console.log('✅ Item created:', created);
        
        // Test updating the item
        setTimeout(() => {
          this.abstractService.update(created.id, { stock: 5 }).subscribe({
            next: (updated) => {
              console.log('✅ Item updated:', updated);
            },
            error: (error) => console.error('❌ Update error:', error)
          });
        }, 1000);
      },
      error: (error) => console.error('❌ Create error:', error)
    });
  }

  // Functional composition methods
  loadFunctionalData() {
    console.log('🔄 Loading data with Functional Composition approach...');
    this.functionalService.getAll().subscribe({
      next: (data) => console.log('✅ Functional data loaded:', data),
      error: (error) => console.error('❌ Functional data error:', error)
    });
  }

  clearFunctionalData() {
    this.functionalService.clear();
  }

  // Pure functional methods
  loadPureData() {
    console.log('🔄 Loading data with Pure Functional approach...');
    this.pureApi.getAll().subscribe({
      next: (data) => console.log('✅ Pure functional data loaded:', data),
      error: (error) => console.error('❌ Pure functional data error:', error)
    });
  }

  clearPureData() {
    this.pureApi.clear();
  }

  // Resource signal methods
  loadResourceData() {
    console.log('🔄 Loading data with Resource Signal approach...');
    this.resourceService.loadAllItems();
    console.log('✅ Resource signal data loading triggered');
  }

  clearResourceData() {
    // Resource signal approach: clear all state and reset triggers
    this.resourceService.clear();
    console.log('🧹 Resource service cleared');
  }

  testResourceOperations() {
    console.log('🧪 Testing Resource Signal CRUD operations...');
    
    // Test creating a new item
    const newItem = {
      name: 'Resource Signal Test Item',
      brand: 'ResourceBrand',
      price: 129.99,
      stock: 15,
      season: 'Summer',
      category: 'Test',
      description: 'Created via Resource Signal API'
    };

    this.resourceService.createItem(newItem).then(created => {
      console.log('✅ Resource item created:', created);
      
      // Test selecting the item
      setTimeout(() => {
        this.resourceService.selectItem(created.id);
        console.log('✅ Resource item selected');
        
        // Test updating the item
        setTimeout(() => {
          this.resourceService.updateItem(created.id, { stock: 8 }).then(updated => {
            console.log('✅ Resource item updated:', updated);
            
            // Test search functionality
            setTimeout(() => {
              this.resourceService.searchByCategory('Test');
              console.log('✅ Resource search by category triggered');
            }, 1000);
            
          }).catch(error => console.error('❌ Resource update error:', error));
        }, 1000);
        
      }, 1000);
      
    }).catch(error => console.error('❌ Resource create error:', error));
  }

  // Utility method for template
  formatCurrency(value: number): string {
    if (value == null || isNaN(value)) {
      return '$0.00';
    }
    return `$${value.toFixed(2)}`;
  }
}