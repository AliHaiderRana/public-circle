import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCampaignById } from '@/actions/campaign';
import { getMessageLogs } from '@/actions/logs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { paths } from '@/routes/paths';
import {
  ArrowLeft,
  Edit,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  MousePointerClick,
  AlertCircle,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const getStatusBadgeVariant = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'default';
    case 'DRAFT':
      return 'secondary';
    case 'PAUSED':
      return 'outline';
    case 'ARCHIVED':
      return 'outline';
    case 'INACTIVE':
      return 'destructive';
    default:
      return 'outline';
  }
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return '—';
  try {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export default function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      Promise.all([
        getCampaignById(id),
        getMessageLogs(`campaignId=${id}&limit=10`).catch(() => null), // Logs might not always be available
      ])
        .then(([campaignResponse, logsResponse]) => {
          if (campaignResponse?.data?.data) {
            setCampaign(campaignResponse.data.data);
          }
          if (logsResponse?.data?.data) {
            const logs = Array.isArray(logsResponse.data.data)
              ? logsResponse.data.data
              : Array.isArray(logsResponse.data.data?.logs)
              ? logsResponse.data.data.logs
              : Array.isArray(logsResponse.data.data?.messages)
              ? logsResponse.data.data.messages
              : [];
            setCampaignLogs(logs.slice(0, 10)); // Show last 10 logs
          }
        })
        .catch((error) => {
          console.error('Error fetching campaign details:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(paths.dashboard.campaign.root)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Campaign Not Found</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">The campaign you're looking for doesn't exist or has been deleted.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from logs if available
  const stats = {
    sent: campaignLogs.filter((log: any) => log.status === 'SENT' || log.status === 'DELIVERED').length,
    opened: campaignLogs.filter((log: any) => log.opened).length,
    clicked: campaignLogs.filter((log: any) => log.clicked).length,
    bounced: campaignLogs.filter((log: any) => log.status === 'BOUNCED' || log.bounced).length,
    failed: campaignLogs.filter((log: any) => log.status === 'FAILED').length,
  };

  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0.0';
  const clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : '0.0';
  const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate(paths.dashboard.campaign.root)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaign.campaignName || campaign.subject || 'Campaign Details'}
            </h1>
            <p className="text-muted-foreground mt-1">
              View campaign information and performance
            </p>
          </div>
        </div>
        <Button onClick={() => navigate(paths.dashboard.campaign.edit(id!))}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Campaign
        </Button>
      </div>

      {/* Stats Cards */}
      {campaignLogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sent}</div>
              <p className="text-xs text-muted-foreground">Total emails sent</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Opened</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.opened}</div>
              <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clicked</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clicked}</div>
              <p className="text-xs text-muted-foreground">{clickRate}% click rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bounced</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bounced}</div>
              <p className="text-xs text-muted-foreground">{bounceRate}% bounce rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed deliveries</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Campaign Information */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
            <CardDescription>Basic campaign details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Campaign Name</p>
              <p className="text-base">{campaign.campaignName || campaign.subject || '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Email Subject</p>
              <p className="text-base">{campaign.emailSubject || campaign.subject || '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
              <Badge variant={getStatusBadgeVariant(campaign.status)} className="mt-1">
                {campaign.status || 'DRAFT'}
              </Badge>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">From Email</p>
              <p className="text-base">{campaign.sourceEmailAddress || '—'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
              <p className="text-base">{campaign.description || 'No description'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Settings</CardTitle>
            <CardDescription>Configuration and scheduling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Run Mode</p>
              <p className="text-base">{campaign.runMode || 'IMMEDIATE'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Frequency</p>
              <p className="text-base">{campaign.frequency || 'ONE_TIME'}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Created At</p>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p className="text-base">{formatDate(campaign.createdAt)}</p>
              </div>
            </div>
            <Separator />
            {campaign.runSchedule && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Scheduled For</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{formatDate(campaign.runSchedule)}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}
            {campaign.lastProcessed && (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Last Processed</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{formatDate(campaign.lastProcessed)}</p>
                  </div>
                </div>
                <Separator />
              </>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Processed Count</p>
              <p className="text-base">{campaign.processedCount || 0} emails</p>
            </div>
            {campaign.isRecurring && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Recurring</p>
                  <p className="text-base">{campaign.isOnGoing ? 'Ongoing' : 'Scheduled'}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Logs Summary */}
      {campaignLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest campaign execution logs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Opened</TableHead>
                    <TableHead>Clicked</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaignLogs.map((log: any, index: number) => (
                    <TableRow key={log._id || log.id || index}>
                      <TableCell className="font-medium">
                        {log.recipientEmail || log.email || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            log.status === 'SENT' || log.status === 'DELIVERED'
                              ? 'default'
                              : log.status === 'BOUNCED' || log.status === 'FAILED'
                              ? 'destructive'
                              : 'outline'
                          }
                        >
                          {log.status || 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.opened ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>
                        {log.clicked ? (
                          <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell>{formatDate(log.createdAt || log.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {campaignLogs.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activity logs available yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Campaign logs will appear here once the campaign starts running
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
