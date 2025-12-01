import { Component } from '@angular/core';
import { Hero } from '@components/hero/hero';
import { ProfessionalExperience } from '@components/professional-experience/professional-experience';
import { Projects } from '@components/projects/projects';
import { AboutMe } from '@components/about-me/about-me';

@Component({
  selector: 'app-home',
  imports: [Hero, ProfessionalExperience, Projects, AboutMe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
