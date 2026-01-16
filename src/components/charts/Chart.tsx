import React from 'react';
import ReactApexChart from 'react-apexcharts';

interface ChartProps {
  type: 'line' | 'area' | 'bar' | 'pie' | 'donut' | 'radialBar' | 'scatter' | 'bubble' | 'heatmap' | 'treemap' | 'boxPlot' | 'candlestick' | 'radar' | 'polarArea' | 'rangeBar';
  series: any[] | number[];
  options: any;
  height?: number | string;
  width?: number | string;
  className?: string;
}

export function Chart({ type, series, options, height = 350, width = '100%', className = '' }: ChartProps) {
  // Ensure we're in the browser
  if (typeof window === 'undefined') {
    return (
      <div className={`chart-container ${className} flex items-center justify-center`} style={{ width, height }}>
        <div className="text-sm text-muted-foreground">
          Chart loading...
        </div>
      </div>
    );
  }

  const updatedOptions = {
    ...options,
    yaxis: {
      ...options?.yaxis,
      labels: {
        ...options?.yaxis?.labels,
        formatter: (value: number) => Math.round(value),
      },
    },
  };

  return (
    <div className={`chart-container ${className}`} style={{ width, height }}>
      <ReactApexChart 
        type={type} 
        series={series} 
        options={updatedOptions} 
        height={typeof height === 'number' ? height : '100%'} 
        width={typeof width === 'number' ? width : '100%'} 
      />
    </div>
  );
}
