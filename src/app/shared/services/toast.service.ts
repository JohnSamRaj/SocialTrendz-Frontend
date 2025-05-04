import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Toast } from '../models/toast.model';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();
  
  constructor() { }
  
  /**
   * Show a toast message
   * @param message Message to display
   * @param type Type of toast (success, error, info, warning)
   * @param duration Duration in ms (default 3000)
   */
  show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 3000): void {
    const id = Date.now().toString();
    const toast: Toast = {
      id,
      message,
      type,
      duration
    };
    
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next([...currentToasts, toast]);
    
    // Auto-remove after duration
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  }
  
  /**
   * Remove a toast by ID
   * @param id Toast ID to remove
   */
  removeToast(id: string): void {
    const currentToasts = this.toastsSubject.value;
    this.toastsSubject.next(currentToasts.filter(toast => toast.id !== id));
  }
  
  /**
   * Show a success toast message
   * @param message Message to display
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }
  
  /**
   * Show an error toast message
   * @param message Message to display
   */
  error(message: string, duration: number = 3000): void {
    this.show(message, 'error', duration);
  }
  
  /**
   * Show an info toast message
   * @param message Message to display
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }
  
  /**
   * Show a warning toast message
   * @param message Message to display
   */
  warning(message: string, duration: number = 3000): void {
    this.show(message, 'warning', duration);
  }
}