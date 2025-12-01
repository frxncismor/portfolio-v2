import { Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { TranslatePipe } from '@pipes/translate.pipe';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [AvatarModule, TranslatePipe, NgOptimizedImage],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {}
