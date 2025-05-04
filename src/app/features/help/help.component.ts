import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToastService } from '../../shared/services/toast.service';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';

interface FAQ {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SkeletonLoaderComponent
  ],
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.css']
})
export class HelpComponent implements OnInit {
  isLoading = true;
  activeTab: 'faq' | 'tutorials' | 'contact' = 'faq';
  searchQuery = '';
  
  faqs: FAQ[] = [
    {
      question: 'How do I connect my Instagram account?',
      answer: 'To connect your Instagram account, navigate to the Instagram Connect page from the sidebar or go to Settings > Connected Accounts. Click on "Connect Instagram" and follow the authentication process to grant SocialTrendz permission to manage your posts.'
    },
    {
      question: 'How do I create and schedule a post?',
      answer: 'Go to Content Creation in the main menu, upload your images or videos, add a caption and hashtags, then select either "Publish Now" or "Schedule for Later". If scheduling, you\'ll need to select a date and time.'
    },
    {
      question: 'What type of analytics are available?',
      answer: 'SocialTrendz provides analytics for engagement rate, follower growth, post performance, and audience demographics. Visit the Analytics page to view detailed reports and insights.'
    },
    {
      question: 'How do I view my scheduled posts?',
      answer: 'Go to the Schedule page to see all your upcoming scheduled posts. From there, you can edit, delete or reschedule any post before it is published.'
    },
    {
      question: 'What file formats are supported for uploads?',
      answer: 'SocialTrendz supports JPEG, PNG, and GIF formats for images, and MP4 for videos. Images should be under 30MB, and videos under 100MB and 60 seconds for regular posts.'
    }
  ];
  
  tutorials = [
    { 
      title: 'Getting Started Guide', 
      description: 'Learn the basics of SocialTrendz and how to set up your account.',
      link: '#getting-started'
    },
    { 
      title: 'Creating Engaging Content', 
      description: 'Tips and tricks for creating content that resonates with your audience.',
      link: '#content-creation'
    },
    { 
      title: 'Understanding Your Analytics', 
      description: 'How to interpret your analytics data to improve your social media strategy.',
      link: '#analytics'
    },
    { 
      title: 'Advanced Scheduling Features', 
      description: 'Make the most of our scheduling tools to save time and maximize engagement.',
      link: '#scheduling'
    }
  ];
  
  constructor(private toastService: ToastService) {}
  
  ngOnInit(): void {
    // Simulate loading delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }
  
  setActiveTab(tab: 'faq' | 'tutorials' | 'contact'): void {
    this.activeTab = tab;
  }
  
  /**
   * Handles the search functionality
   * @param event Input event from search field
   */
  onSearch(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchQuery = inputElement.value;
    
    if (this.searchQuery.trim()) {
      this.toastService.info(`Searching for "${this.searchQuery}"...`);
      // Implement actual search functionality here
      setTimeout(() => {
        this.toastService.success(`Found results for "${this.searchQuery}"`);
      }, 1000);
    }
  }
  
  /**
   * Handles the start chat button click
   */
  startChat(): void {
    this.toastService.info('Connecting to live chat support...');
    // Implement actual chat functionality here
    setTimeout(() => {
      this.toastService.success('Connected to support. A representative will be with you shortly.');
    }, 1500);
  }
  
  /**
   * Handles the send message form submission
   */
  sendMessage(): void {
    this.toastService.info('Sending your message...');
    // Implement actual message sending functionality here
    setTimeout(() => {
      this.toastService.success('Message sent successfully! We\'ll respond to you within 24 hours.');
    }, 1500);
  }
}