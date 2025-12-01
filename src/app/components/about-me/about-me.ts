import { Component } from '@angular/core';
import { TranslatePipe } from '@pipes/translate.pipe';

@Component({
  selector: 'app-about-me',
  imports: [TranslatePipe],
  templateUrl: './about-me.html',
  styleUrl: './about-me.css',
})
export class AboutMe {}
