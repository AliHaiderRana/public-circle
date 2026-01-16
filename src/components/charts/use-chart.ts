import { useTheme } from 'next-themes';

export function useChart(options: any = {}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const baseColors = {
    primary: isDark ? '#3b82f6' : '#2563eb',
    secondary: isDark ? '#8b5cf6' : '#7c3aed',
    success: isDark ? '#10b981' : '#059669',
    warning: isDark ? '#f59e0b' : '#d97706',
    error: isDark ? '#ef4444' : '#dc2626',
    info: isDark ? '#06b6d4' : '#0891b2',
  };

  const textColor = isDark ? '#e5e7eb' : '#1f2937';
  const textSecondaryColor = isDark ? '#9ca3af' : '#6b7280';
  const borderColor = isDark ? '#374151' : '#e5e7eb';
  const backgroundColor = isDark ? '#111827' : '#ffffff';

  return {
    ...options,
    chart: {
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
      ...options.chart,
    },
    colors: options.colors || [baseColors.primary, baseColors.warning],
    stroke: {
      width: 2,
      ...options.stroke,
    },
    fill: {
      opacity: 0.48,
      ...options.fill,
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    legend: {
      show: options.legend?.show ?? false,
      position: options.legend?.position || 'top',
      horizontalAlign: options.legend?.horizontalAlign || 'right',
      fontSize: '13px',
      fontWeight: 500,
      labels: {
        colors: textColor,
      },
      markers: {
        shape: 'circle',
        ...options.legend?.markers,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 8,
        ...options.legend?.itemMargin,
      },
    },
    grid: {
      borderColor,
      strokeDashArray: 4,
      ...options.grid,
    },
    xaxis: {
      labels: {
        style: {
          colors: Array(10).fill(textSecondaryColor),
        },
      },
      ...options.xaxis,
    },
    yaxis: {
      labels: {
        style: {
          colors: textSecondaryColor,
        },
        formatter: (value: number) => Math.round(value).toString(),
      },
      ...options.yaxis,
    },
    tooltip: {
      theme: isDark ? 'dark' : 'light',
      ...options.tooltip,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '48%',
        ...options.plotOptions?.bar,
      },
      pie: {
        donut: {
          labels: {
            show: true,
            value: {
              fontSize: '20px',
              fontWeight: 600,
              color: textColor,
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '13px',
              color: textSecondaryColor,
            },
          },
        },
        ...options.plotOptions?.pie,
      },
      ...options.plotOptions,
    },
  };
}
