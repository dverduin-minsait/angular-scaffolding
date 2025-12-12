import { Component } from '@angular/core';


@Component({
  selector: 'app-responsive-demo',
  standalone: true,
  imports: [],
  template: `
    <div class="responsive-demo">
      <div class="grid-demo">
        <div class="grid-item">Item 1</div>
        <div class="grid-item">Item 2</div>
        <div class="grid-item">Item 3</div>
        <div class="grid-item">Item 4</div>
        <div class="grid-item">Item 5</div>
        <div class="grid-item">Item 6</div>
      </div>
      <p class="responsive-note">
        This grid automatically adapts to different screen sizes and themes.
      </p>
    </div>
  `,
  styleUrl: './responsive-demo.component.scss'
})
export class ResponsiveDemoComponent {}