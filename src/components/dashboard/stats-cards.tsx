import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MousePointerClick, Eye, AlertCircle, Users } from 'lucide-react';

interface DashboardStats {
  emailsSentThisMonthCount?: number;
  emailsOpenedCount?: number;
  emailsClickedCount?: number;
  emailsBouncedCount?: number;
  companyContactsCount?: number;
  // For rates calculation
  emailsDeliveredCount?: number;
  emailsSentCount?: number;
}

interface DashboardStatsCardsProps {
  dashboardStats: DashboardStats | null;
}

export function DashboardStatsCards({ dashboardStats }: DashboardStatsCardsProps) {
  const stats = dashboardStats || {};

  // Calculate rates
  const openRate = stats.emailsDeliveredCount && stats.emailsOpenedCount
    ? ((stats.emailsOpenedCount / stats.emailsDeliveredCount) * 100).toFixed(1)
    : '0.0';

  const clickRate = stats.emailsDeliveredCount && stats.emailsClickedCount
    ? ((stats.emailsClickedCount / stats.emailsDeliveredCount) * 100).toFixed(1)
    : '0.0';

  const bounceRate = stats.emailsSentCount && stats.emailsBouncedCount
    ? ((stats.emailsBouncedCount / stats.emailsSentCount) * 100).toFixed(1)
    : '0.0';

  const statsData = [
    {
      title: 'Emails Sent',
      value: (stats.emailsSentThisMonthCount ?? 0).toLocaleString(),
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Total emails sent this month',
    },
    {
      title: 'Open Rate',
      value: `${openRate}%`,
      icon: Eye,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Percentage of emails opened',
    },
    {
      title: 'Click Rate',
      value: `${clickRate}%`,
      icon: MousePointerClick,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Percentage of emails clicked',
    },
    {
      title: 'Bounces',
      value: (stats.emailsBouncedCount ?? 0).toLocaleString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: 'Total bounced emails',
    },
    {
      title: 'Contacts',
      value: (stats.companyContactsCount ?? 0).toLocaleString(),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Total contacts in database',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
