export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
}

export interface AccountGrowth {
  date: Date;
  followers: number;
  followersGrowth: number;
  followersGrowthPercentage: number;
}

export interface EngagementMetrics {
  date: Date;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  engagementRate: number;
}

export interface ContentPerformance {
  postId: string;
  postType: string;
  publishedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  impressions: number;
  reach: number;
  engagementRate: number;
}

export interface AudienceDemographics {
  ageRanges: {
    range: string;
    percentage: number;
  }[];
  genders: {
    gender: string;
    percentage: number;
  }[];
  topLocations: {
    location: string;
    percentage: number;
  }[];
  activeHours: {
    hour: number;
    activity: number;
  }[];
}

export interface AnalyticsOverview {
  timeframe: AnalyticsTimeframe;
  accountGrowth: AccountGrowth[];
  engagementMetrics: EngagementMetrics[];
  contentPerformance: ContentPerformance[];
  audienceDemographics: AudienceDemographics;
}
