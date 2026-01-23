import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats } from '@/actions/dashboard';
import { getOverageQuota } from '@/actions/invoices';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import dayjs from 'dayjs';
import { DashboardStatsCards } from '@/components/dashboard/stats-cards';
import { QuotaUsage } from '@/components/dashboard/quota-usage';
import { EmailAnalyticsChart } from '@/components/dashboard/email-analytics-chart';
import { useAuthContext } from '@/auth/hooks/use-auth-context';
import { paths } from '@/routes/paths';
import { useAutoRefresh } from '@/hooks/use-auto-refresh';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function AnalyticsPage() {
  const { user } = useAuthContext();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { quota } = getOverageQuota();

  // Generate mock chart data for demonstration
  const generateMockChartData = useCallback((period: 'daily' | 'monthly' | 'yearly') => {
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
  }, []);

  const fetchDashboardStats = useCallback(async () => {
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
  }, [selectedPeriod, selectedDate, generateMockChartData]);

  // Auto-refresh every 30 seconds
  const { refresh: autoRefresh } = useAutoRefresh({
    enabled: true,
    interval: 30000,
    onRefresh: async () => {
      await fetchDashboardStats();
    },
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardStats();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const formatChartData = (data: any) => {
    if (!data) return { categories: [], series: [] };

    const categories = Object.keys(data).map((timeRange) => {
      return timeRange;
    });

    const values = Object.values(data) as number[];

    return {
      categories,
      series: [
        {
          name: 'Emails Sent',
          data: values,
        },
      ],
    };
  };

  if (isLoading && !dashboardStats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userName = user?.firstName || user?.displayName || 'there';

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Hi, Welcome back {userName} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Track your email performance and usage metrics
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isLoading || isRefreshing}
                className="h-9 w-9 self-start sm:self-auto"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh analytics data</TooltipContent>
          </Tooltip>
        </TooltipProvider>
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

export default AnalyticsPage;
