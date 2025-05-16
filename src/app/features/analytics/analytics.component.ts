import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstagramService } from '../../core/services/instagram.service';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { PostCardComponent } from '../../shared/components/post-card/post-card.component';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import { SkeletonCardComponent } from '../../shared/components/skeleton-card/skeleton-card.component';
import { 
  AnalyticsOverview, 
  AnalyticsTimeframe 
} from '../../core/models/analytics.model';
import { Post, PostType } from '../../core/models/post.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ChartComponent,
    PostCardComponent,
    SkeletonLoaderComponent,
    SkeletonCardComponent
  ],
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  analytics: AnalyticsOverview | null = null;
  topPerformingPosts: Post[] = [];
  selectedTimeframe: string = '30days';
  noPlatformsConnected = false;

  // Helper methods for template
  getBestPostingHour(): string {
    if (!this.analytics) return 'N/A';
    if (!this.analytics.audienceDemographics) return 'N/A';
    if (!this.analytics.audienceDemographics.activeHours) return 'N/A';
    if (this.analytics.audienceDemographics.activeHours.length === 0) return 'N/A';

    // Now we're sure all properties exist and are non-null
    const activeHours = this.analytics.audienceDemographics.activeHours;
    let bestHour = activeHours[0];

    for (const hourData of activeHours) {
      if (hourData.activity > bestHour.activity) {
        bestHour = hourData;
      }
    }

    return `${bestHour.hour}:00`;
  }

  // Chart data
  followerGrowthData: any = {};
  engagementRateData: any = {};
  contentTypeData: any = {};
  hourlyActivityData: any = {};

  isLoading = true;
  error: string | null = null;

  constructor(private instagramService: InstagramService) { }

  ngOnInit(): void {
    // Start with loading state
    this.isLoading = true;
    
    // Simulate initial loading delay
    setTimeout(() => {
      this.loadAnalytics();
    }, 1000);
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed - implementation required by OnDestroy interface
  }
  
  @HostListener('window:resize')
  onWindowResize(): void {
    // Redraw charts on window resize to adapt to new screen size
    if (this.analytics) {
      this.prepareChartData();
    }
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.error = null;
    this.noPlatformsConnected = false;

    // First check if the user has connected platforms
    this.instagramService.getConnectedAccounts().subscribe({
      next: (accounts) => {
        if (!accounts || accounts.length === 0) {
          // No connected platforms
          this.noPlatformsConnected = true;
          this.isLoading = false;
        } else {
          // User has connected platforms, load analytics data
          this.instagramService.getInstagramInsights().subscribe({
            next: (data) => {
              this.analytics = data;
              this.prepareChartData();
              this.isLoading = false;
            },
            error: (err) => {
              this.error = 'Failed to load analytics data';
              this.isLoading = false;
              console.error('Error loading analytics:', err);
            }
          });
        }
      },
      error: (err) => {
        // this.error = 'Failed to check connected accounts';
        this.isLoading = false;
        console.error('Error checking connected accounts:', err);
      }
    });

    // Load top performing posts
    this.instagramService.getPublishedPosts().subscribe({
      next: (posts) => {
        // Sort by engagement rate (if available)
        this.topPerformingPosts = posts
          .filter(post => post.engagement)
          .sort((a, b) => {
            const aEngagement = a.engagement?.likes || 0;
            const bEngagement = b.engagement?.likes || 0;
            return bEngagement - aEngagement;
          })
          .slice(0, 4);
      }
    });
  }

  prepareChartData(): void {
    if (!this.analytics) return;

    // Determine if we're on mobile view
    const isMobile = window.innerWidth <= 768;
    
    // Follower Growth Chart - reduce data points on mobile
    let accountGrowthData = [...this.analytics.accountGrowth];
    
    // For mobile view, reduce the number of data points to avoid crowding
    if (isMobile && accountGrowthData.length > 5) {
      // For small screens, only keep first, last, and a few key points in between
      const dataLength = accountGrowthData.length;
      if (dataLength > 7) {
        // Keep first, last, and only a few strategic points
        const firstItem = accountGrowthData[0];
        const lastItem = accountGrowthData[dataLength - 1];
        
        // Pick ~3 evenly spaced points from the middle
        const midPoints = [];
        const stride = Math.floor(dataLength / 4);
        for (let i = 1; i < 4; i++) {
          const index = i * stride;
          if (index > 0 && index < dataLength - 1) {
            midPoints.push(accountGrowthData[index]);
          }
        }
        
        accountGrowthData = [firstItem, ...midPoints, lastItem];
      } else {
        // For fewer points, just show odd indices
        accountGrowthData = accountGrowthData.filter((_, index) => index % 2 === 0);
      }
    }
    
    const growthDates = accountGrowthData.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const followerCounts = accountGrowthData.map(item => item.followers);
    const growthRates = accountGrowthData.map(item => item.followersGrowthPercentage);

    this.followerGrowthData = {
      labels: growthDates,
      datasets: [
        {
          label: 'Followers',
          data: followerCounts,
          borderColor: '#F14F0A', // Using brand color from requirements
          backgroundColor: 'rgba(242, 127, 10, 0.2)', // Using brand color with transparency
          tension: 0.4,
          yAxisID: 'y',
          fill: true
        },
        {
          label: 'Growth Rate (%)',
          data: growthRates,
          borderColor: '#F2A10A', // Using brand color from requirements
          backgroundColor: 'rgba(242, 215, 10, 0.5)', // Using brand color with transparency
          borderDash: [5, 5],
          tension: 0.4,
          yAxisID: 'y1',
          fill: false
        }
      ]
    };

    // // Engagement Rate Chart
    // const engagementDates = this.analytics.engagementMetrics.map(item => 
    //   new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    // );

    // const engagementRates = this.analytics.engagementMetrics.map(item => item.engagementRate);

    // this.engagementRateData = {
    //   labels: engagementDates,
    //   datasets: [
    //     {
    //       label: 'Engagement Rate (%)',
    //       data: engagementRates,
    //       borderColor: '#c17da9',
    //       backgroundColor: 'rgba(193, 125, 169, 0.2)',
    //       tension: 0.4,
    //       fill: true
    //     }
    //   ]
    // };

    // // Content Type Performance Chart
    // if (!this.analytics.contentPerformance) {
    //   this.contentTypeData = { labels: [], datasets: [] };
    //   return;
    // }

    // const contentTypes = Array.from(new Set(this.analytics.contentPerformance.map(item => item.postType)));
    // const contentTypeLabels = contentTypes.map(type => {
    //   switch (type) {
    //     case PostType.IMAGE: return 'Image';
    //     case PostType.VIDEO: return 'Video';
    //     case PostType.CAROUSEL: return 'Carousel';
    //     case PostType.STORY: return 'Story';
    //     case PostType.REEL: return 'Reel';
    //     default: return type;
    //   }
    // });

    // const contentTypeEngagement = contentTypes.map(type => {
    //   // We know this.analytics can't be null here because we checked earlier
    //   const analytics = this.analytics as AnalyticsOverview; // Type assertion
    //   const postsOfType = analytics.contentPerformance.filter(item => item.postType === type);
    //   return postsOfType.reduce((sum, post) => sum + post.engagementRate, 0) / postsOfType.length;
    // });

    // this.contentTypeData = {
    //   labels: contentTypeLabels,
    //   datasets: [
    //     {
    //       label: 'Avg. Engagement Rate (%)',
    //       data: contentTypeEngagement,
    //       backgroundColor: [
    //         '#f79ed8',
    //         '#c17da9',
    //         '#8c5c7b',
    //         '#563b4c',
    //         '#201a1e'
    //       ],
    //       borderWidth: 0
    //     }
    //   ]
    // };

    // Hourly Activity Chart
    if (!this.analytics.audienceDemographics || !this.analytics.audienceDemographics.activeHours) {
      this.hourlyActivityData = { labels: [], datasets: [] };
      return;
    }

    const hours = this.analytics.audienceDemographics.activeHours.map(item => 
      `${item.hour}:00`
    );

    const activity = this.analytics.audienceDemographics.activeHours.map(item => 
      item.activity
    );

    this.hourlyActivityData = {
      labels: hours,
      datasets: [
        {
          label: 'Audience Activity',
          data: activity,
          backgroundColor: '#FEA82F',
          borderRadius: 6
        }
      ]
    };
  }

  onTimeframeChange(): void {
    // In a real app, this would reload data for the selected timeframe
    // For now, we'll just simulate a loading state
    this.isLoading = true;

    setTimeout(() => {
      this.loadAnalytics();
    }, 500);
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  getAudienceGrowth(): number {
    if (!this.analytics || this.analytics.accountGrowth.length < 2) {
      return 0;
    }

    const latest = this.analytics.accountGrowth[this.analytics.accountGrowth.length - 1];
    const previous = this.analytics.accountGrowth[this.analytics.accountGrowth.length - 2];

    return latest.followersGrowth;
  }

  getAudienceGrowthPercentage(): number {
    if (!this.analytics || this.analytics.accountGrowth.length < 2) {
      return 0;
    }

    const latest = this.analytics.accountGrowth[this.analytics.accountGrowth.length - 1];
    return latest.followersGrowthPercentage;
  }

  getAverageEngagementRate(): number {
    if (!this.analytics || this.analytics.engagementMetrics.length === 0) {
      return 0;
    }

    const total = this.analytics.engagementMetrics.reduce((sum, metric) => sum + metric.engagementRate, 0);
    return total / this.analytics.engagementMetrics.length;
  }

  getTotalImpressions(): number {
    if (!this.analytics || this.analytics.engagementMetrics.length === 0) {
      return 0;
    }

    return this.analytics.engagementMetrics.reduce((sum, metric) => sum + metric.impressions, 0);
  }

  getTotalReach(): number {
    if (!this.analytics || this.analytics.engagementMetrics.length === 0) {
      return 0;
    }

    return this.analytics.engagementMetrics.reduce((sum, metric) => sum + metric.reach, 0);
  }
}
