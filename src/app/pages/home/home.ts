import { Component } from '@angular/core';
import { Hero } from '@components/hero/hero';
import { TechStack } from '@components/tech-stack/tech-stack';
import { ProfessionalExperience } from '@components/professional-experience/professional-experience';
import { Projects } from '@components/projects/projects';
import { AboutMe } from '@components/about-me/about-me';

@Component({
  selector: 'app-home',
  imports: [Hero, TechStack, ProfessionalExperience, Projects, AboutMe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {}
