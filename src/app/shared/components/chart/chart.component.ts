import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Use dynamic import for Chart.js to avoid "Cannot use import statement outside a module" error
declare const Chart: any;

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  @Input() type: 'line' | 'bar' | 'pie' | 'doughnut' = 'line';
  @Input() data: any = {};
  @Input() options: any = {};
  @Input() height: number = 300;
  
  private chart: any = null;
  
  ngAfterViewInit(): void {
    this.createChart();
  }
  
  createChart(): void {
    if (!this.chartCanvas) return;
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Apply default styling
    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              family: 'Inter, sans-serif'
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(32, 26, 30, 0.8)',
          titleFont: {
            family: 'Inter, sans-serif',
            size: 14
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 13
          },
          padding: 10,
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif'
            }
          }
        },
        y: {
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              family: 'Inter, sans-serif'
            }
          }
        }
      }
    };
    
    // Apply brand colors
    const brandColors = [
      '#FF6701',
      '#FEA82F',
      '#FF6500',
      '#FFC288',
      '#0B0300'
    ];
    
    // Set default colors if not provided
    if (this.data.datasets) {
      this.data.datasets.forEach((dataset: any, index: number) => {
        if (!dataset.backgroundColor) {
          if (this.type === 'line') {
            dataset.borderColor = dataset.borderColor || brandColors[index % brandColors.length];
            dataset.backgroundColor = dataset.backgroundColor || brandColors[index % brandColors.length] + '20';
          } else {
            dataset.backgroundColor = dataset.backgroundColor || 
              (Array.isArray(dataset.data) ? 
                dataset.data.map((_: any, i: number) => brandColors[i % brandColors.length]) : 
                brandColors[index % brandColors.length]);
          }
        }
      });
    }
    
    // Merge options
    const mergedOptions = {
      ...defaultOptions,
      ...this.options
    };
    
    // Create chart
    this.chart = new Chart(ctx, {
      type: this.type,
      data: this.data,
      options: mergedOptions
    });
  }
  
  updateChart(): void {
    if (this.chart) {
      this.chart.data = this.data;
      this.chart.update();
    }
  }
  
  ngOnChanges(): void {
    if (this.chart) {
      this.updateChart();
    }
  }
  
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
