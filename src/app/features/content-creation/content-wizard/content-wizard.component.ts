import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Content Wizard data model
export interface ContentWizardData {
  group: string;
  subGroup: string;
  platform: string;
  contentType: string;
  niche: string;
  audience: string;
  tone: string;
  goal: string;
  mainTopic: string;
  generateImage: boolean;
  businessInfo: {
    businessType: string;
    services: string[];
  };
}

@Component({
  selector: 'app-content-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-wizard.component.html',
  styleUrls: ['./content-wizard.component.css']
})
export class ContentWizardComponent implements OnInit {
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<ContentWizardData>();

  // Step handling
  currentStep = 1;
  totalSteps = 4;

  // Form data
  wizardData: ContentWizardData = {
    group: '',
    subGroup: '',
    platform: 'Instagram',
    contentType: 'Reel',
    niche: '',
    audience: '',
    tone: 'Fun and Bold',
    goal: 'Increase followers',
    mainTopic: '',
    generateImage: false,
    businessInfo: {
      businessType: '',
      services: []
    }
  };

  // Service input field
  newService = '';

  // Form options
  groups = ['Fashion', 'Beauty', 'Technology', 'Food', 'Travel', 'Fitness', 'Education', 'Other'];
  
  subGroups: { [key: string]: string[] } = {
    'Fashion': ['Fashion Designer', 'Fashion Blogger', 'Model', 'Stylist', 'Retail Brand'],
    'Beauty': ['Makeup Artist', 'Hair Stylist', 'Skincare Expert', 'Nail Technician', 'Beauty Blogger'],
    'Technology': ['Software Developer', 'Tech Reviewer', 'IT Consultant', 'Gadget Enthusiast', 'Tech Startup'],
    'Food': ['Chef', 'Food Blogger', 'Restaurant', 'Bakery', 'Nutritionist'],
    'Travel': ['Travel Blogger', 'Tour Guide', 'Travel Agency', 'Adventure Photographer', 'Hotel'],
    'Fitness': ['Fitness Trainer', 'Yoga Instructor', 'Gym Owner', 'Nutritionist', 'Sports Coach'],
    'Education': ['Teacher', 'Online Course Creator', 'Tutor', 'Educational Institution', 'Educational Content Creator'],
    'Other': ['Other']
  };
  
  platforms = ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok', 'Pinterest', 'YouTube'];
  
  contentTypes: { [key: string]: string[] } = {
    'Instagram': ['Post', 'Reel', 'Story', 'Carousel', 'IGTV'],
    'Facebook': ['Post', 'Video', 'Story', 'Live', 'Event'],
    'Twitter': ['Tweet', 'Thread', 'Poll', 'Moment'],
    'LinkedIn': ['Post', 'Article', 'Poll', 'Document', 'Event'],
    'TikTok': ['Video', 'Duet', 'Stitch'],
    'Pinterest': ['Pin', 'Board', 'Story Pin', 'Video Pin'],
    'YouTube': ['Video', 'Short', 'Live', 'Playlist']
  };
  
  tones = [
    'Fun and Bold', 
    'Professional and Informative', 
    'Inspirational', 
    'Casual and Friendly',
    'Luxury and Exclusive', 
    'Educational', 
    'Motivational', 
    'Minimalist and Clean'
  ];
  
  goals = [
    'Increase followers',
    'Drive engagement',
    'Generate leads',
    'Increase brand awareness',
    'Drive sales',
    'Educate audience',
    'Build community',
    'Showcase products/services'
  ];

  constructor() { }

  ngOnInit(): void {
  }

  // Navigation functions
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  // Close the wizard
  closeWizard(): void {
    this.close.emit();
  }

  // Validation functions
  canProceed(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.wizardData.group && !!this.wizardData.subGroup && !!this.wizardData.businessInfo.businessType;
      case 2:
        return !!this.wizardData.platform && !!this.wizardData.contentType && !!this.wizardData.niche;
      case 3:
        return !!this.wizardData.audience && !!this.wizardData.tone && !!this.wizardData.goal;
      default:
        return true;
    }
  }

  canSubmit(): boolean {
    return !!this.wizardData.mainTopic;
  }

  // Add a new service to the services array
  addService(): void {
    if (this.newService.trim()) {
      this.wizardData.businessInfo.services.push(this.newService.trim());
      this.newService = '';
    }
  }

  // Remove a service from the services array
  removeService(index: number): void {
    this.wizardData.businessInfo.services.splice(index, 1);
  }

  // Submit the wizard data
  submitWizard(): void {
    this.submit.emit(this.wizardData);
    this.closeWizard();
  }

  // Get available content types based on selected platform
  getContentTypes(): string[] {
    return this.contentTypes[this.wizardData.platform] || [];
  }

  // Get available subgroups based on selected group
  getSubGroups(): string[] {
    return this.subGroups[this.wizardData.group] || [];
  }
} 