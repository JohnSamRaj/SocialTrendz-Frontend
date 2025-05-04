import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, PostStatus } from '../../../core/models/post.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  posts: Post[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() posts: Post[] = [];
  @Output() daySelected = new EventEmitter<Date>();
  @Output() postSelected = new EventEmitter<Post>();
  
  currentDate = new Date();
  currentMonth = this.currentDate.getMonth();
  currentYear = this.currentDate.getFullYear();
  calendarDays: CalendarDay[] = [];
  
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  ngOnInit(): void {
    this.generateCalendar();
  }
  
  ngOnChanges(): void {
    this.generateCalendar();
  }
  
  generateCalendar(): void {
    this.calendarDays = [];
    
    // Get first day of month
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    
    // Get last day of month
    const lastDayOfMonth = new Date(this.currentYear, this.currentMonth + 1, 0);
    const totalDaysInMonth = lastDayOfMonth.getDate();
    
    // Get last day of previous month
    const lastDayOfPrevMonth = new Date(this.currentYear, this.currentMonth, 0);
    const prevMonthDays = lastDayOfPrevMonth.getDate();
    
    // Add days from previous month
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1, prevMonthDays - i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        posts: this.getPostsForDate(date)
      });
    }
    
    // Add days from current month
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: true,
        isToday: this.isToday(date),
        posts: this.getPostsForDate(date)
      });
    }
    
    // Add days from next month to complete the grid (6 rows of 7 days)
    const remainingDays = 42 - this.calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: false,
        isToday: this.isToday(date),
        posts: this.getPostsForDate(date)
      });
    }
  }
  
  getPostsForDate(date: Date): Post[] {
    return this.posts.filter(post => {
      const targetDate = post.scheduledFor || post.publishedAt;
      if (!targetDate) return false;
      
      const postDate = new Date(targetDate);
      return postDate.getDate() === date.getDate() &&
             postDate.getMonth() === date.getMonth() &&
             postDate.getFullYear() === date.getFullYear();
    });
  }
  
  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }
  
  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }
  
  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }
  
  selectDay(day: CalendarDay): void {
    this.daySelected.emit(day.date);
  }
  
  selectPost(post: Post, event: Event): void {
    event.stopPropagation();
    this.postSelected.emit(post);
  }
  
  getPostClass(post: Post): string {
    if (post.status === PostStatus.PUBLISHED) {
      return 'post-published';
    } else if (post.status === PostStatus.SCHEDULED) {
      return 'post-scheduled';
    } else if (post.status === PostStatus.DRAFT) {
      return 'post-draft';
    } else {
      return 'post-failed';
    }
  }
  
  formatTime(date: Date | undefined): string {
    if (!date) return '';
    
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
}
