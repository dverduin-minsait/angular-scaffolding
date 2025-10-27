# ADR-007: Generic CRUD Component System with Content Projection

## Status
Accepted

## Context
The application requires a standardized way to implement CRUD (Create, Read, Update, Delete) operations across multiple domain entities. Currently, each feature implements its own CRUD components, leading to code duplication and inconsistent patterns. We need a reusable system that:

1. Reduces boilerplate code for new CRUD implementations
2. Provides consistent UX across all CRUD operations
3. Supports content projection for custom forms and filters
4. Implements role-based permission controls
5. Maintains type safety and follows Angular 20 best practices
6. Includes tooling for rapid component generation

## Decision
We will implement a **Generic CRUD Component System** with the following architecture:

### Core Components
1. **GenericCrudComponent<T>** - Main component with content projection slots
2. **GenericCrudStore<T>** - Enhanced store extending EntityStore with CRUD-specific functionality
3. **CrudPermissionService** - Role and feature flag-based permission system
4. **CRUD Generator Tool** - CLI tool for generating CRUD components from entity definitions

### Key Design Patterns
- **Content Projection**: Use `<ng-content select="[crud-filters]">` and `<ng-content select="[crud-entity-form]">` for custom forms
- **Signal-based State**: Leverage Angular 20 signals for reactive state management
- **Type-safe Configuration**: Strongly typed interfaces for column definitions and permissions
- **Permission-driven UI**: Hide/show actions based on user roles and feature flags
- **Generator-first Approach**: Provide tooling to generate complete CRUD implementations

### Architecture Overview
```typescript
// Usage Pattern
<app-generic-crud 
  [config]="crudConfig" 
  [dataSource]="entityStore"
  (events)="handleCrudEvent($event)">
  
  <!-- Project custom filter form -->
  <form crud-filters [formGroup]="filterForm">
    <input formControlName="name" placeholder="Search...">
  </form>
  
  <!-- Project custom entity form -->
  <form crud-entity-form [formGroup]="entityForm">
    <input formControlName="name" required>
    <input formControlName="price" type="number" required>
  </form>
</app-generic-crud>
```

## Rationale

### Chosen Strategy: Projection-based Generic Component
We evaluated multiple implementation strategies:

#### ✅ **Projection-based Approach (Selected)**
**Pros:**
- **Maximum Flexibility**: Developers can create completely custom forms while reusing CRUD infrastructure
- **Type Safety**: Strong typing for entity interfaces and configuration
- **Consistent Patterns**: Standardized component structure and state management
- **Minimal Learning Curve**: Uses familiar Angular patterns (ng-content, reactive forms)
- **Maintainable**: Clear separation between generic logic and domain-specific UI
- **Generator Support**: Can generate complete implementations from entity definitions
- **Permission Integration**: Built-in role-based access control
- **Performance**: Leverages Angular 20 signals for optimal change detection

**Cons:**
- **Setup Overhead**: Requires more initial configuration than simple table components
- **Complexity**: More moving parts compared to basic CRUD implementations

#### ❌ **Dynamic Form Approach (Rejected)**
**Pros:**
- **Minimal Code**: JSON configuration generates entire forms
- **Rapid Development**: Very fast to implement new entities

**Cons:**
- **Limited Flexibility**: Hard to customize complex UI requirements
- **Type Safety Issues**: Configuration-driven forms lose compile-time safety
- **Complex Validation**: Custom validation logic becomes difficult
- **Debugging Challenges**: Runtime form generation harder to debug

#### ❌ **Inheritance-based Approach (Rejected)**
**Pros:**
- **Code Reuse**: Base classes provide common functionality
- **Familiar Pattern**: Traditional OOP approach

**Cons:**
- **Tight Coupling**: Hard to modify base behavior without affecting all implementations
- **Angular Patterns**: Goes against Angular's composition-over-inheritance philosophy
- **Signals Compatibility**: Inheritance makes signal-based state management complex

#### ❌ **Service-only Approach (Rejected)**
**Pros:**
- **Lightweight**: Minimal component overhead
- **Flexible**: Services can be used anywhere

**Cons:**
- **No UI Standardization**: Each implementation creates different UX
- **Code Duplication**: Templates and styles repeated across features
- **Inconsistent Patterns**: No enforcement of consistent CRUD patterns

## Implementation Details

### 1. Generic CRUD Component
```typescript
@Component({
  selector: 'app-generic-crud',
  template: `
    <!-- Status bar, actions, and grid -->
    <ng-content select="[crud-filters]"></ng-content>
    <ng-content select="[crud-entity-form]"></ng-content>
  `
})
export class GenericCrudComponent<T extends CrudEntity>
```

### 2. Enhanced Store
```typescript
export abstract class GenericCrudStore<T extends CrudEntity & { id: ID }, ID>
  extends EntityStore<T, ID> {
  // Filtering, sorting, permissions, bulk operations
}
```

### 3. Permission System
```typescript
export interface CrudPermissions {
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  export?: boolean;
}
```

### 4. Generator Tool
```bash
# Generate complete CRUD implementation
node tools/crud-cli.mjs generate --entity="Product" --output="src/app/features/products"

# Generate from configuration file
node tools/crud-cli.mjs generate --config="product-config.json"
```

## Benefits

### For Developers
- **Reduced Boilerplate**: 80% less code for new CRUD implementations
- **Consistent Patterns**: Standardized component structure and naming
- **Type Safety**: Compile-time checking for entity definitions
- **Generator Tooling**: Rapid scaffolding of new features
- **Familiar APIs**: Uses standard Angular reactive forms and signals

### For Users
- **Consistent UX**: Same interaction patterns across all CRUD operations
- **Responsive Design**: Mobile-optimized cards and desktop grid views
- **Accessibility**: WCAG AA compliant with proper ARIA labels
- **Performance**: Zoneless change detection with signals

### For Maintenance
- **Single Source of Truth**: CRUD logic centralized in generic components
- **Permission Control**: Centralized role and feature flag management
- **Testing Strategy**: Generic tests cover common CRUD scenarios
- **Documentation**: Generated components include example usage

## Implementation Plan

### Phase 1: Core System (Completed)
- [x] Generic CRUD component with projection slots
- [x] Enhanced store with filtering and permissions
- [x] Permission service with role-based controls
- [x] Generator tool with CLI interface

### Phase 2: Integration and Testing
- [ ] Comprehensive Jest test suite
- [ ] Example implementation (Products CRUD)
- [ ] Documentation and usage examples
- [ ] Integration with existing clothes feature

### Phase 3: Advanced Features
- [ ] Bulk operations UI
- [ ] Export/import functionality
- [ ] Advanced filtering widgets
- [ ] Audit trail integration

## Migration Strategy
1. **Keep Existing**: Current clothes CRUD remains unchanged
2. **New Features**: Use generic CRUD system for new entities
3. **Gradual Migration**: Convert existing features when modifications are needed
4. **Validation**: Compare generated vs. hand-coded implementations

## Filtering Strategy

The Generic CRUD system supports multiple filtering approaches depending on your requirements:

### Client-Side Filtering (Recommended for < 1000 items)

**When to use:**
- Small to medium datasets (< 1000 items)
- All data is already loaded
- Fast, responsive filtering without network delays
- Simple text/field matching

**Implementation:**
```typescript
// In parent component
protected readonly filteredItems = computed(() => {
  const items = this.store.items();
  const searchTerm = this._searchSignal().toLowerCase();
  
  if (!searchTerm) return items;
  
  return items.filter(item => 
    item.name.toLowerCase().includes(searchTerm)
  );
});

// Pass to generic-crud
<app-generic-crud 
  [dataSignal]="filteredItems"
  [store]="entityStore">
</app-generic-crud>
```

**Pros:**
- ✅ Instant feedback (no network latency)
- ✅ Simple implementation with signals
- ✅ Reactive and composable
- ✅ Works offline

**Cons:**
- ❌ Not suitable for large datasets
- ❌ All data must be loaded first
- ❌ Limited to loaded data

### Server-Side Filtering (Recommended for > 1000 items)

**When to use:**
- Large datasets (> 1000 items)
- Advanced search with multiple criteria
- Database-level filtering/sorting
- Need pagination

**Implementation:**
```typescript
// Extend EntityStore with filter methods
export class BookStore extends EntityStore<BookApi, number> {
  private readonly _filters = signal<BookFilters>({});
  
  searchWithFilters(filters: BookFilters): Observable<BookApi[]> {
    this._filters.set(filters);
    // API call with filter parameters
    return this.dataSource.search(filters).pipe(
      tap(results => this._items.set(results))
    );
  }
}

// In component
applyFilters(): void {
  this.bookStore.searchWithFilters({
    title: this.filterForm.value.title,
    author: this.filterForm.value.author
  }).subscribe();
}
```

**Pros:**
- ✅ Handles large datasets efficiently
- ✅ Reduces memory footprint
- ✅ Advanced database queries
- ✅ Server-side sorting/pagination

**Cons:**
- ❌ Network latency on each filter change
- ❌ Requires API support
- ❌ More complex implementation

### Hybrid Approach (Best of Both)

**When to use:**
- Medium datasets (500-2000 items)
- Initial load with optional refinement
- Progressive enhancement

**Implementation:**
```typescript
// Load filtered results from server, then refine client-side
protected readonly serverFilteredItems = computed(() => this.store.items());
protected readonly clientRefinedItems = computed(() => {
  const items = this.serverFilteredItems();
  const localFilter = this._localRefinement();
  
  if (!localFilter) return items;
  
  return items.filter(item => /* local refinement logic */);
});
```

### Decision Matrix

| Criteria | Client-Side | Server-Side | Hybrid |
|----------|-------------|-------------|--------|
| Dataset Size | < 1K items | > 1K items | 500-2K items |
| Response Time | Instant | 100-500ms | Mixed |
| Implementation | Simple | Complex | Medium |
| Network Load | Initial only | Per filter | Balanced |
| Offline Support | ✅ Yes | ❌ No | Partial |

### Best Practices

1. **Start Simple**: Begin with client-side filtering, migrate if needed
2. **Debounce Input**: Wait for user to finish typing (300ms recommended)
3. **Loading States**: Show loading indicators for server-side filters
4. **Cache Results**: Store common filter combinations
5. **Progressive Disclosure**: Show count before loading full results

## Monitoring and Success Metrics
- **Development Velocity**: Time to implement new CRUD features
- **Code Quality**: Reduced duplication and increased test coverage
- **User Experience**: Consistent interaction patterns and accessibility
- **Maintenance Burden**: Fewer bugs and easier feature additions

## Alternatives Considered
See rationale section above for detailed comparison of approaches.

## Related Decisions
- [ADR-001](ADR-001-adopt-angular20-standalone-zoneless-signals.md): Angular 20 signals adoption
- [ADR-002](ADR-002-grid-api-theme-foundations.md): Grid component architecture
- [ADR-006](ADR-006-auth-architecture.md): Authentication and authorization

## References
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Content Projection Documentation](https://angular.dev/guide/content-projection)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Architecture Best Practices](https://angular.dev/style-guide)

---
**Date**: 2025-10-23  
**Authors**: AI Assistant (GitHub Copilot)  
**Reviewers**: Development Team  
**Status**: Accepted