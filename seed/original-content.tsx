
import React from 'react';
import {
  ShoppingBag,
  Zap,
  Brain,
  Code,
  BarChart3,
  PlayCircle,
  Target,
  Eye,
  ShieldCheck,
  MessageSquare,
  Globe,
  Settings,
  Layers,
  Tag as TagIcon,
  ExternalLink,
  BookOpen,
  Download,
  FileText
} from 'lucide-react';
import { Service, Project, Review, VideoContent, Deal, Resource } from '../types';

export const BRAND_INFO = {
  name: "Md Tanvir Hossain",
  phone: "01774338612",
  whatsapp: "8801774338612",
  email: "devtanvirhossain@gmail.com",
  founderOf: "Fast IT Care",
  founderUrl: "https://fastitcare.com.bd",
  aboutBio: "আমি গত ৫ বছর ধরে বাংলাদেশের ই-কমার্স ইন্ডাস্ট্রিতে কাজ করছি। আমার মূল লক্ষ্য হলো উদ্যোক্তাদের এমন একটি সিস্টেম উপহার দেওয়া যা তাদের ব্যবসার জটিলতা কমিয়ে দেয় এবং অটোমেশনের মাধ্যমে প্রফিট নিশ্চিত করে। টেকনোলজি যখন সঠিক সাইকোলজির সাথে যুক্ত হয়, তখনই একটি বিজনেস স্কেল করা সম্ভব।",
  socials: {
    youtube: "https://www.youtube.com/@m.tanvir.hossain",
    linkedin: "https://www.linkedin.com/in/md-tanvir-hossain/",
    facebook: "https://www.facebook.com/its.tanvir.hossain",
    twitter: "https://x.com/mTanvirHossain",
    github: "https://github.com/m-tanvir-hossain",
    instagram: "https://www.instagram.com/m.tanvir.hossain/"
  }
};

export const SERVICES: Service[] = [
  {
    id: 1,
    title: "High Converting eCommerce Website",
    description: "Psychology + CRO + Automation for maximum sales impact.",
    icon: "ShoppingBag",
    features: ["Custom UI/UX", "Conversion Optimized", "Fast Performance"]
  },
  {
    id: 2,
    title: "Advanced Landing Page Funnel",
    description: "Multi-stage funnels designed for Lead → Conversion → Retention.",
    icon: "Layers",
    features: ["Sales Copywriting", "A/B Testing", "Email Automation"]
  },
  {
    id: 3,
    title: "Custom eCommerce System (Laravel)",
    description: "Scalable, secure, and tailor-made for specific business needs.",
    icon: "Code",
    features: ["API Integration", "Scalable Database", "Enterprise Security"]
  },
  {
    id: 4,
    title: "Automation & Inventory System (SellBook)",
    description: "Complete control over Order, Stock, Courier, and Profit tracking.",
    icon: "Settings",
    features: ["Courier API", "Profit Calculator", "Real-time Stock"]
  },
  {
    id: 5,
    title: "Consultation & Business Architecture",
    description: "Strategic planning of Funnel, System Design, and Growth pathways.",
    icon: "Target",
    features: ["Market Analysis", "System Blueprinting", "Performance Audit"]
  }
];

export const VIDEOS: VideoContent[] = [
  {
    id: "v1",
    title: "কেন ৯০% eCommerce fail করে?",
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1074&auto=format&fit=crop",
    duration: "12:45"
  },
  {
    id: "v2",
    title: "Website Psychology Explained",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1170&auto=format&fit=crop",
    duration: "15:20"
  },
  {
    id: "v3",
    title: "Automation কিভাবে profit বাঁচায়?",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1115&auto=format&fit=crop",
    duration: "10:10"
  },
  {
    id: "v4",
    title: "Build Landing Pages in 10 Mins",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1172&auto=format&fit=crop",
    duration: "08:55"
  }
];

export const PROJECTS: Project[] = [
  {
    id: 1,
    title: "eCommerce Sales Machine",
    description: "Psychology-driven storefront for high-ticket fashion brand.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1170&auto=format&fit=crop",
    category: "Storefront"
  },
  {
    id: 2,
    title: "SellBook Inventory Dashboard",
    description: "Centralized automation hub for multi-channel sales.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1170&auto=format&fit=crop",
    category: "Automation"
  },
  {
    id: 3,
    title: "Health Supplement Funnel",
    description: "High-conversion landing page with upsell architecture.",
    image: "https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=1171&auto=format&fit=crop",
    category: "Funnel"
  }
];

export const DEALS: Deal[] = [
  {
    id: 1,
    title: "Bluehost Exclusive Hosting",
    description: "The most reliable hosting for WordPress websites with a free domain.",
    discount: "70% OFF",
    tag: "Hosting",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1172&auto=format&fit=crop",
    link: "https://www.bluehost.com"
  },
  {
    id: 2,
    title: "Elementor Pro Page Builder",
    description: "Design high-converting landing pages without any coding skills.",
    discount: "25% OFF",
    tag: "Tools",
    image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1170&auto=format&fit=crop",
    link: "https://elementor.com"
  },
  {
    id: 3,
    title: "Hostinger Business Plan",
    description: "Lightning fast speed for eCommerce stores at an unbeatable price.",
    discount: "80% OFF",
    tag: "Hosting",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=1170&auto=format&fit=crop",
    link: "https://www.hostinger.com"
  }
];

export const RESOURCES: Resource[] = [
  {
    id: 1,
    title: "eCommerce Automation Blueprint",
    description: "A complete step-by-step guide to automating your sales and inventory.",
    type: 'free',
    tag: 'Ebook',
    image: "https://images.unsplash.com/photo-1589998059171-988d887df646?q=80&w=1176&auto=format&fit=crop",
    downloadUrl: "#"
  },
  {
    id: 2,
    title: "High-Converting Copywriting Templates",
    description: "Proven templates for landing pages that double your conversion rate.",
    type: 'paid',
    tag: 'Document',
    image: "https://images.unsplash.com/photo-1517842645767-c639042777db?q=80&w=1170&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Facebook Ads Strategy for BD Founders",
    description: "Specific strategies used by the top 1% eCommerce owners in Bangladesh.",
    type: 'free',
    tag: 'Guide',
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1170&auto=format&fit=crop",
    downloadUrl: "#"
  },
  {
    id: 4,
    title: "Inventory Master Spreadsheet",
    description: "Advanced Excel system to track every single penny and stock item.",
    type: 'paid',
    tag: 'Tool',
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1172&auto=format&fit=crop"
  }
];

export const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Rahat Ahmed",
    role: "CEO, TechWear BD",
    quote: "Tanvir didn't just build a site; he built a system that saves me 4 hours daily. The automation is incredible.",
    rating: 5,
    image: "https://picsum.photos/seed/p1/100/100"
  },
  {
    id: 2,
    name: "Samiul Islam",
    role: "Founder, GreenVibe",
    quote: "My conversion rate jumped from 1.2% to 4.5% after implementing the psychological triggers Tanvir suggested.",
    rating: 5,
    image: "https://picsum.photos/seed/p2/100/100"
  },
  {
    id: 3,
    name: "Junaid Khan",
    role: "Owner, PureHarvest",
    quote: "The inventory system Tanvir designed solved our biggest stock nightmare. Highly recommended!",
    rating: 5,
    image: "https://picsum.photos/seed/p3/100/100"
  }
];

export const ICON_MAP: Record<string, any> = {
  ShoppingBag,
  Zap,
  Brain,
  Code,
  BarChart3,
  PlayCircle,
  Target,
  Eye,
  ShieldCheck,
  MessageSquare,
  Globe,
  Settings,
  Layers,
  TagIcon,
  ExternalLink,
  BookOpen,
  Download,
  FileText
};
