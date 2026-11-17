
export interface Service {
  id: number;
  title: string;
  description: string;
  icon: string;
  features: string[];
}

export interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  category: string;
}

export interface Review {
  id: number;
  name: string;
  role: string;
  quote: string;
  rating: number;
  image: string;
}

export interface VideoContent {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
}

export interface Deal {
  id: number;
  title: string;
  description: string;
  discount: string;
  image: string;
  link: string;
  tag: string;
}

export interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'free' | 'paid';
  image: string;
  downloadUrl?: string;
  tag: string;
}
