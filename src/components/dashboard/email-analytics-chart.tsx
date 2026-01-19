import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chart } from '@/components/charts/Chart';
import { useChart } from '@/components/charts/use-chart';
import dayjs, { Dayjs } from 'dayjs';

interface EmailAnalyticsChartProps {
  title: string;
  subheader: string;
  selectedDate: Dayjs;
  setSelectedDate: (date: Dayjs) => void;
  selectedPeriod: 'daily' | 'monthly' | 'yearly';
  setSelectedPeriod: (period: 'daily' | 'monthly' | 'yearly') => void;
  loading: boolean;
  chart: {
    categories: string[];
    series: Array<{ name: string; data: number[] }>;
  };
}

export function EmailAnalyticsChart({
  title,
  subheader,
  selectedDate,
  setSelectedDate,
  selectedPeriod,
  setSelectedPeriod,
  loading,
  chart,
}: EmailAnalyticsChartProps) {
  const chartOptions = useChart({
    colors: ['#3b82f6', '#8b5cf6', '#10b981'],
    stroke: {
      width: 2,
    },
    xaxis: {
      categories: chart.categories || [],
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value.toLocaleString()}`,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '60%',
      },
    },
  });

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period as 'daily' | 'monthly' | 'yearly');
  };

  const handleMonthChange = (month: string) => {
    setSelectedDate(selectedDate.month(parseInt(month)));
  };

  const handleYearChange = (year: string) => {
    setSelectedDate(selectedDate.year(parseInt(year)));
  };

  const currentYear = dayjs().year();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const months = [
    { value: '0', label: 'January' },
    { value: '1', label: 'February' },
    { value: '2', label: 'March' },
    { value: '3', label: 'April' },
    { value: '4', label: 'May' },
    { value: '5', label: 'June' },
    { value: '6', label: 'July' },
    { value: '7', label: 'August' },
    { value: '8', label: 'September' },
    { value: '9', label: 'October' },
    { value: '10', label: 'November' },
    { value: '11', label: 'December' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <CardDescription className="mt-1">{subheader}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Selectors */}
            {selectedPeriod === 'daily' && (
              <>
                <Select
                  value={selectedDate.month().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-full sm:w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedDate.year().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            {selectedPeriod === 'monthly' && (
              <Select
                value={selectedDate.year().toString()}
                onValueChange={handleYearChange}
              >
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : chart.categories.length === 0 || chart.series.length === 0 ? (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No data available</p>
              <p className="text-xs mt-1">Select a different period to view analytics</p>
            </div>
          </div>
        ) : (
          <Chart
            type="bar"
            series={chart.series}
            options={chartOptions}
            height={400}
            className="py-4"
          />
        )}
      </CardContent>
    </Card>
  );
}
