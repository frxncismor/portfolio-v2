import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TranslatePipe } from '@pipes/translate.pipe';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [AvatarModule, TranslatePipe, NgOptimizedImage],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero implements AfterViewInit {
  ngAfterViewInit(): void {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      setTimeout(() => {
        heroSection.classList.add('animate-in');
      }, 100);
    }
  }
}
