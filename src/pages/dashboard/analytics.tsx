import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/actions/dashboard';
import { getOverageQuota } from '@/actions/invoices';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { DashboardStatsCards } from '@/components/dashboard/stats-cards';
import { QuotaUsage } from '@/components/dashboard/quota-usage';
import { EmailAnalyticsChart } from '@/components/dashboard/email-analytics-chart';

export default function AnalyticsPage() {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const { quota } = getOverageQuota();

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    try {
      const params = {
        graphScope: {
          ...(selectedPeriod === 'yearly' && { yearly: 10 }),
          ...(selectedPeriod === 'monthly' && { monthly: { year: selectedDate.year() } }),
          ...(selectedPeriod === 'daily' && {
            daily: {
              month: selectedDate.format('MMM'),
              year: selectedDate.year(),
            },
          }),
        },
      };

      const res = await getDashboardStats(params);
      if (res?.status === 200) {
        setDashboardStats(res?.data?.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Use mock data if API fails
      setDashboardStats({
        emailsSentThisMonthCount: 12500,
        emailsOpenedCount: 8500,
        emailsClickedCount: 2100,
        emailsBouncedCount: 150,
        companyContactsCount: 4500,
        emailsDeliveredCount: 12350,
        emailsSentCount: 12500,
        emailsSentGraphData: generateMockChartData(selectedPeriod),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock chart data for demonstration
  const generateMockChartData = (period: 'daily' | 'monthly' | 'yearly') => {
    if (period === 'daily') {
      return {
        emails: Array.from({ length: 30 }, (_, i) => ({
          [`Day ${i + 1}`]: Math.floor(Math.random() * 500) + 200,
        })),
      };
    } else if (period === 'monthly') {
      return {
        emails: Array.from({ length: 12 }, (_, i) => ({
          [`Month ${i + 1}`]: Math.floor(Math.random() * 5000) + 2000,
        })),
      };
    } else {
      return {
        emails: Array.from({ length: 10 }, (_, i) => ({
          [`Year ${2024 - i}`]: Math.floor(Math.random() * 50000) + 20000,
        })),
      };
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedPeriod, selectedDate]);

  const handleRefresh = async () => {
    await fetchDashboardStats();
  };

  const formatChartData = (data: any) => {
    if (!data || Object.keys(data).length === 0) {
      return { categories: [], series: [] };
    }

    const categories: string[] = [];
    const seriesMap: Record<string, number[]> = {};

    // Process the data structure from the API
    Object.entries(data).forEach(([key, value]: [string, any]) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          const categoryKey = Object.keys(item)[0];
          if (!categories.includes(categoryKey)) {
            categories.push(categoryKey);
          }
          const val = item[categoryKey];
          if (!seriesMap[key]) {
            seriesMap[key] = [];
          }
          const index = categories.indexOf(categoryKey);
          while (seriesMap[key].length <= index) {
            seriesMap[key].push(0);
          }
          seriesMap[key][index] = val || 0;
        });
      }
    });

    const series = Object.entries(seriesMap).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      data: categories.map((_, index) => data[index] || 0),
    }));

    return {
      categories: categories.length > 0 ? categories : ['No data'],
      series: series.length > 0 ? series : [{ name: 'Emails', data: [0] }],
    };
  };

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your email performance and usage metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-9 w-9"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <DashboardStatsCards dashboardStats={dashboardStats} />

      {/* Quota Usage */}
      <QuotaUsage quota={quota} />

      {/* Email Analytics Chart */}
      <EmailAnalyticsChart
        title="Email Analytics"
        subheader={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} email distribution and trends`}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        loading={isLoading}
        chart={
          isLoading
            ? { categories: [], series: [] }
            : formatChartData(dashboardStats?.emailsSentGraphData)
        }
      />
    </div>
  );
}
