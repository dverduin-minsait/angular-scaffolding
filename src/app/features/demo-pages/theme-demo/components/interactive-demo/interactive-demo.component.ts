import { Component } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ButtonDirective } from '../../../../../shared/directives';

@Component({
  selector: 'app-interactive-demo',
  standalone: true,
  imports: [FormsModule, ButtonDirective],
  template: `
    <div class="interactive-demo">
      <div class="component-grid">
        <div class="component-group">
          <h4>Buttons</h4>
          <div class="demo-buttons">
            <button appButton variant="primary">Primary Button</button>
            <button appButton variant="secondary">Secondary Button</button>
            <button appButton variant="ghost">Ghost Button</button>
            <button appButton variant="primary" disabled>Disabled Button</button>
          </div>
        </div>
        
        <div class="component-group">
          <h4>Form Elements</h4>
          <div class="demo-inputs">
            <label for="demo-text">Text Input</label>
            <input id="demo-text" type="text" placeholder="Enter text..." />
            
            <label for="demo-email">Email Input</label>
            <input id="demo-email" type="email" placeholder="Enter email..." />
            
            <label for="demo-select">Select</label>
            <select id="demo-select">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
            
            <label class="checkbox-label">
              <input type="checkbox" checked />
              <span>Checkbox option</span>
            </label>
          </div>
        </div>
        
        <div class="component-group">
          <h4>Cards</h4>
          <div class="demo-cards">
            <div class="demo-card">
              <h5>Standard Card</h5>
              <p>This card demonstrates the standard card styling with theme variables.</p>
              <button appButton variant="primary" size="sm">Action</button>
            </div>
            <div class="demo-card">
              <h5>Another Card</h5>
              <p>Cards automatically adapt to light and dark themes seamlessly.</p>
              <button appButton variant="secondary" size="sm">Secondary</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './interactive-demo.component.scss'
})
export class InteractiveDemoComponent {}