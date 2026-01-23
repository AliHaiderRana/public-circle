import { Card } from '@/components/ui/card';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DashboardStats {
  emailsSentThisMonthCount?: number;
  emailsOpenedCount?: number;
  emailsClickedCount?: number;
  emailsBouncedCount?: number;
  companyContactsCount?: number;
  emailsDeliveredCount?: number;
  emailsSentCount?: number;
  activeCampaignsCount?: number;
  inActiveCampaignsCount?: number;
  draftCampaignsCount?: number;
  averageEmailsPerMonth?: number;
  growthCalculation?: string;
  hardBouncedCount?: number;
}

interface DashboardStatsCardsProps {
  dashboardStats: DashboardStats | null;
}

export function DashboardStatsCards({ dashboardStats }: DashboardStatsCardsProps) {
  const stats = dashboardStats || {};

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Campaigns Breakdown Card */}
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Campaigns Breakdown</h3>
          <div className="space-y-2">
            {[
              { label: 'Active Campaigns', value: stats.activeCampaignsCount ?? 0 },
              { label: 'Inactive Campaigns', value: stats.inActiveCampaignsCount ?? 0 },
              { label: 'In Draft', value: stats.draftCampaignsCount ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Email Success Rate Card */}
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Email Success Rate</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Delivery rate',
                value: `${stats.emailsDeliveredCount ?? 0}%`,
                tooltip: "The percentage of emails delivered to recipients' mail servers.",
              },
              {
                label: 'Delivery-to-open rate (DTOR)',
                value: `${stats.emailsOpenedCount ?? 0}%`,
                tooltip:
                  'The percentage of recipients who opened the email. To calculate the DTOR, divide the number of opened emails by the number of delivered emails, then multiply by 100.',
              },
              {
                label: 'Click-through rate (CTR)',
                value: `${stats.emailsClickedCount ?? 0}%`,
                tooltip:
                  'The percentage of all recipients who clicked on a link in an email. To calculate CTR, divide the number of clicks by the number of emails delivered, then multiply by 100.',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-1 gap-2">
                <div className="flex items-start gap-1 flex-1">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer shrink-0 mt-0.5" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-xs">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Company Contacts Card */}
        <Card className="p-6 flex flex-col">
          <h3 className="text-base font-bold mb-4">Company Contacts</h3>
          <div className="flex-1 flex items-center justify-center">
            <span className="text-4xl font-bold text-muted-foreground">
              {(stats.companyContactsCount ?? 0).toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Emails Sent Card */}
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Emails Sent</h3>
          <div className="space-y-2">
            {[
              {
                label: 'This month',
                value: `${stats.emailsSentThisMonthCount ?? 0}`,
                tooltip: "Current month's emails sent.",
              },
              {
                label: 'Avg. per month',
                value: `${stats.averageEmailsPerMonth?.toFixed(2) ?? 0}`,
                tooltip: 'Average monthly emails sent (since joining Public Circles).',
              },
              {
                label: 'Growth',
                value: `${stats.growthCalculation ?? '0%'}`,
                tooltip: 'Growth % = ((current month / average month) - 1) x 100',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-xs">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Bounced Emails Card */}
        <Card className="p-6">
          <h3 className="text-base font-bold mb-4">Bounced Emails</h3>
          <div className="space-y-2">
            {[
              {
                label: 'Total bounced',
                value: `${stats.emailsBouncedCount ?? 0}`,
                tooltip: 'Total number of emails that bounced.',
              },
              {
                label: 'Bounce rate',
                value: `${stats.emailsSentCount && stats.emailsBouncedCount ? ((stats.emailsBouncedCount / stats.emailsSentCount) * 100).toFixed(2) : 0}%`,
                tooltip: 'The percentage of sent emails that bounced. Bounce rate = (bounced emails / sent emails) x 100.',
              },
              {
                label: 'Hard bounces',
                value: `${stats.hardBouncedCount ?? 0}`,
                tooltip: 'Permanent delivery failures (invalid email addresses).',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-[250px]">
                      <p className="text-xs">{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <span className="text-sm font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}
