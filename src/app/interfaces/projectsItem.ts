export interface ProjectsItem {
  title: string;
  description: string;
  link?: string;
  image?: string;
  code?: string;
  technologies?: Technology[];
}

export interface Technology {
  name: string;
  color: string;
}
