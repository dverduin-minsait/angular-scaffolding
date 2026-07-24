import {
  Component,
  computed,
  input
} from '@angular/core';

@Component({
  selector: 'app-paper-texture',
  standalone: true,
  templateUrl: './paper-texture.component.html',
  styleUrl: './paper-texture.component.scss'
})
export class PaperTextureComponent {

  // ==========================================
  // INPUTS
  // ==========================================

  paperColor = input('#f4edd8');

  seed = input(42);

  macroWrinkles = input(8);

  mediumWrinkles = input(20);

  microWrinkles = input(50);

  lightDirection = input(135);

  wrinkleStrength = input(1);

  // ==========================================
  // RANDOM
  // ==========================================

  private random(seed: number) {
    let value = seed;

    return () => {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  }

  // ==========================================
  // WRINKLE GENERATION
  // ==========================================

  private createWrinkleBackground(
    count: number,
    minSize: number,
    maxSize: number,
    opacity: number,
    seedOffset: number
  ): string {

    const rnd =
      this.random(
        this.seed() + seedOffset
      );

    const gradients: string[] = [];

    for (let i = 0; i < count; i++) {

      const angle = rnd() * 180;

      const size =
        minSize +
        rnd() *
        (maxSize - minSize);

      const posX =
        Math.round(rnd() * size);

      const posY =
        Math.round(rnd() * size);

      gradients.push(`
        linear-gradient(
          ${angle}deg,

          transparent 42%,

          rgba(255,255,255,${opacity})
          48%,

          rgba(255,255,255,${opacity * 0.5})
          49.5%,

          rgba(0,0,0,${opacity * 0.15})
          50.5%,

          rgba(0,0,0,${opacity})
          53%,

          transparent 58%
        )
        ${posX}px ${posY}px /
        ${size}px ${size}px
        repeat
      `);
    }

    return gradients.join(',');
  }

  // ==========================================
  // LAYERS
  // ==========================================

  macroLayer = computed(() =>
    this.createWrinkleBackground(
      this.macroWrinkles(),
      600,
      1200,
      0.12 * this.wrinkleStrength(),
      1000
    )
  );

  mediumLayer = computed(() =>
    this.createWrinkleBackground(
      this.mediumWrinkles(),
      200,
      600,
      0.08 * this.wrinkleStrength(),
      2000
    )
  );

  microLayer = computed(() =>
    this.createWrinkleBackground(
      this.microWrinkles(),
      40,
      150,
      0.03 * this.wrinkleStrength(),
      3000
    )
  );

  // ==========================================
  // PAPER FIBERS
  // ==========================================

  fiberLayer = computed(() => {

    const rnd =
      this.random(this.seed() + 5000);

    const fibers: string[] = [];

    for (let i = 0; i < 40; i++) {

      const angle = 80 + rnd() * 20;
      const size = 15 + rnd() * 30;

      fibers.push(`
        linear-gradient(
          ${angle}deg,
          transparent 49.5%,
          rgba(255,255,255,.025) 50%,
          transparent 50.5%
        ) 0 0 /
        ${size}px ${size}px
        repeat
      `);
    }

    return fibers.join(',');
  });

  // ==========================================
  // STYLE BINDING
  // ==========================================

  paperStyle = computed(() => ({
    backgroundColor: this.paperColor()
  }));
}