export interface OnboardingQuestion {
  id: number;
  type: 'mcq' | 'open-ended';
  question: string;
  options?: string[]; // For MCQ questions
  required: boolean;
}

// 15 MCQ and 10 open-ended questions as per requirements
export const onboardingQuestions: OnboardingQuestion[] = [
  // MCQ Questions (15)
  {
    id: 1,
    type: 'mcq',
    question: 'Which social media platform do you use most frequently?',
    options: ['Instagram', 'Facebook', 'Twitter', 'LinkedIn', 'TikTok'],
    required: true
  },
  {
    id: 2,
    type: 'mcq',
    question: 'How often do you post on social media?',
    options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely'],
    required: true
  },
  {
    id: 3,
    type: 'mcq',
    question: 'What type of content do you typically share?',
    options: ['Photos', 'Videos', 'Text posts', 'Articles', 'Mix of content'],
    required: true
  },
  {
    id: 4,
    type: 'mcq',
    question: 'What is your primary goal with social media?',
    options: ['Build a personal brand', 'Grow business', 'Connect with friends', 'Share experiences', 'Stay informed'],
    required: true
  },
  {
    id: 5,
    type: 'mcq',
    question: 'How important are analytics to your social media strategy?',
    options: ['Very important', 'Somewhat important', 'Neutral', 'Not very important', 'Not important at all'],
    required: true
  },
  {
    id: 6,
    type: 'mcq',
    question: 'Do you use scheduling tools for your social media posts?',
    options: ['Yes, regularly', 'Sometimes', 'Rarely', 'No, but interested', 'No, not interested'],
    required: false
  },
  {
    id: 7,
    type: 'mcq',
    question: 'How do you measure social media success?',
    options: ['Engagement rate', 'Follower growth', 'Conversions/sales', 'Brand awareness', 'Personal satisfaction'],
    required: true
  },
  {
    id: 8,
    type: 'mcq',
    question: 'What time of day do you typically post content?',
    options: ['Morning', 'Afternoon', 'Evening', 'Late night', 'Varies widely'],
    required: false
  },
  {
    id: 9,
    type: 'mcq',
    question: 'How much time do you spend on content creation weekly?',
    options: ['Less than 1 hour', '1-3 hours', '4-7 hours', '8-15 hours', 'More than 15 hours'],
    required: true
  },
  {
    id: 10,
    type: 'mcq',
    question: 'Do you collaborate with others on your content?',
    options: ['Yes, regularly', 'Sometimes', 'Rarely', 'No, but interested', 'No, not interested'],
    required: false
  },
  {
    id: 11,
    type: 'mcq',
    question: 'What aspect of social media do you find most challenging?',
    options: ['Content creation', 'Consistency', 'Growth', 'Engagement', 'Analytics/strategy'],
    required: true
  },
  {
    id: 12,
    type: 'mcq',
    question: 'Are you interested in monetizing your social media presence?',
    options: ['Already monetizing', 'Very interested', 'Somewhat interested', 'Not right now', 'Not interested'],
    required: true
  },
  {
    id: 13,
    type: 'mcq',
    question: 'What is your experience level with social media marketing?',
    options: ['Beginner', 'Intermediate', 'Advanced', 'Professional', 'Expert'],
    required: true
  },
  {
    id: 14,
    type: 'mcq',
    question: 'How would you describe your content style?',
    options: ['Educational', 'Entertaining', 'Inspirational', 'Promotional', 'Personal/lifestyle'],
    required: true
  },
  {
    id: 15,
    type: 'mcq',
    question: 'Which content format performs best for you?',
    options: ['Images', 'Short videos', 'Long videos', 'Text posts', 'Stories/ephemeral content'],
    required: false
  },
  
  // Open-ended Questions (10)
  {
    id: 16,
    type: 'open-ended',
    question: 'What are your main topics or themes for your social media content?',
    required: true
  },
  {
    id: 17,
    type: 'open-ended',
    question: 'Describe your target audience or followers.',
    required: true
  },
  {
    id: 18,
    type: 'open-ended',
    question: 'What are your social media goals for the next 3 months?',
    required: true
  },
  {
    id: 19,
    type: 'open-ended',
    question: 'What tools or apps do you currently use for social media?',
    required: false
  },
  {
    id: 20,
    type: 'open-ended',
    question: 'What type of content has performed best for you in the past?',
    required: false
  },
  {
    id: 21,
    type: 'open-ended',
    question: 'What specific features would help you most with your social media strategy?',
    required: true
  },
  {
    id: 22,
    type: 'open-ended',
    question: 'How do you currently plan your content calendar?',
    required: false
  },
  {
    id: 23,
    type: 'open-ended',
    question: 'What are your biggest pain points with social media management?',
    required: true
  },
  {
    id: 24,
    type: 'open-ended',
    question: 'What brands or creators inspire your social media strategy?',
    required: false
  },
  {
    id: 25,
    type: 'open-ended',
    question: 'What would success with this platform look like for you?',
    required: true
  }
];
