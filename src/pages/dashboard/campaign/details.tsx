import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCampaignById, getCampaignSegmentCounts } from '@/actions/campaign';
import { getMessageLogs } from '@/actions/logs';
import { getAllTemplates, getTemplateById } from '@/actions/templates';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
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
  Users,
  FileText,
  Building2,
  RefreshCw,
  Play,
  Pause,
  Archive,
  ArchiveRestore,
  ExternalLink,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SegmentCountDialog } from '@/components/campaign/SegmentCountDialog';

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
  const [template, setTemplate] = useState<any>(null);
  const [segments, setSegments] = useState<any[]>([]);
  const [segmentCountDialogOpen, setSegmentCountDialogOpen] = useState(false);
  const [segmentCountResult, setSegmentCountResult] = useState<any>(null);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      Promise.all([
        getCampaignById(id),
        getMessageLogs(`campaignId=${id}&limit=10`).catch(() => null),
      ])
        .then(async ([campaignResponse, logsResponse]) => {
          if (campaignResponse?.data?.data) {
            const campaignData = campaignResponse.data.data;
            setCampaign(campaignData);

            // Fetch template if available
            if (campaignData.emailTemplate || campaignData.emailTemplateId) {
              const templateId = campaignData.emailTemplate || campaignData.emailTemplateId;
              const templateRes = await getTemplateById(templateId);
              if (templateRes?.status === 200) {
                setTemplate(templateRes.data.data);
              }
            }

            // Fetch segments if available
            if (campaignData.segments && campaignData.segments.length > 0) {
              const segmentIds = campaignData.segments.map((s: any) => s._id || s);
              // Segments are already populated in campaign data
              const fetchedSegments = campaignData.segments.map((s: any) => ({
                _id: s._id || s,
                name: s.name || s.segmentName || 'Unknown Segment',
              }));
              setSegments(fetchedSegments || []);
            }

            // Fetch segment counts
            if (campaignData.segments && campaignData.segments.length > 0) {
              const segmentIds = campaignData.segments.map((s: any) => s._id || s);
              const countsRes = await getCampaignSegmentCounts(id);
              if (countsRes?.status === 200) {
                setSegmentCountResult(countsRes.data.data);
              }
            }
          } else {
            setCampaign(null);
          }
          if (logsResponse?.data?.data) {
            const logs = Array.isArray(logsResponse.data.data)
              ? logsResponse.data.data
              : Array.isArray(logsResponse.data.data?.logs)
              ? logsResponse.data.data.logs
              : Array.isArray(logsResponse.data.data?.messages)
              ? logsResponse.data.data.messages
              : [];
            setCampaignLogs(logs.slice(0, 10));
          }
        })
        .catch((error: any) => {
          console.error('Error fetching campaign details:', error);
          const errorMessage =
            error?.response?.data?.message || error?.message || 'Failed to load campaign';

          if (error?.response?.status === 404) {
            toast.error('Campaign not found. It may have been deleted.');
            setCampaign(null);
            setTimeout(() => navigate(paths.dashboard.campaign.root), 2000);
          } else if (error?.response?.status === 403) {
            toast.error('You do not have permission to access this campaign.');
            setTimeout(() => navigate(paths.dashboard.campaign.root), 2000);
          } else {
            toast.error(errorMessage);
            setCampaign(null);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
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
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                The campaign you're looking for doesn't exist or has been deleted.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate(paths.dashboard.campaign.root)}
              >
                Back to Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats from logs if available
  const stats = {
    sent: campaignLogs.filter((log: any) => log.status === 'SENT' || log.status === 'DELIVERED')
      .length,
    opened: campaignLogs.filter((log: any) => log.opened).length,
    clicked: campaignLogs.filter((log: any) => log.clicked).length,
    bounced: campaignLogs.filter(
      (log: any) => log.status === 'BOUNCED' || log.bounced
    ).length,
    failed: campaignLogs.filter((log: any) => log.status === 'FAILED').length,
  };

  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(1) : '0.0';
  const clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(1) : '0.0';
  const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(1) : '0.0';

  const segmentIds = campaign.segments?.map((s: any) => s._id || s) || [];

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
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
            <p className="text-muted-foreground mt-1">View campaign information and performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(paths.dashboard.campaign.edit(id!))}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={() => navigate(`${paths.dashboard.logs.detail}?campaignId=${id}&campaignName=${encodeURIComponent(campaign.campaignName || 'Campaign')}`)}>
            <Eye className="mr-2 h-4 w-4" />
            View Logs
          </Button>
        </div>
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

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Campaign Information */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
                <CardDescription>Basic campaign details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Campaign ID</p>
                  <p className="text-base font-mono">{campaign.campaignCompanyId || '—'}</p>
                </div>
                <Separator />
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
                {campaign.cc && campaign.cc.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">CC</p>
                      <p className="text-base text-sm">{campaign.cc.join(', ')}</p>
                    </div>
                  </>
                )}
                {campaign.bcc && campaign.bcc.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">BCC</p>
                      <p className="text-base text-sm">{campaign.bcc.join(', ')}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Campaign Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Settings</CardTitle>
                <CardDescription>Configuration and scheduling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {campaign.companyGroupingId && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Group</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">
                          {campaign.companyGroupingId?.groupName ||
                            campaign.companyGroupingId ||
                            '—'}
                        </p>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Run Mode</p>
                  <p className="text-base">{campaign.runMode || 'INSTANT'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Frequency</p>
                  <p className="text-base">
                    {campaign.frequency === 'MANY_TIMES' ? 'Every re-match' : 'One time'}
                  </p>
                </div>
                <Separator />
                {campaign.isRecurring && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Recurring</p>
                      <p className="text-base">
                        {campaign.isOnGoing
                          ? 'Ongoing'
                          : campaign.recurringPeriod
                          ? `Every ${campaign.recurringPeriod}`
                          : 'Yes'}
                      </p>
                    </div>
                    <Separator />
                  </>
                )}
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
              </CardContent>
            </Card>
          </div>

          {/* Template and Segments Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            {template && (
              <Card>
                <CardHeader>
                  <CardTitle>Email Template</CardTitle>
                  <CardDescription>Template used for this campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <p className="text-base font-medium">{template.name}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {segments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Segments</CardTitle>
                  <CardDescription>
                    {segments.length} segment{segments.length > 1 ? 's' : ''} selected
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {segments.slice(0, 3).map((segment: any) => (
                      <Badge key={segment._id} variant="secondary">
                        {segment.name}
                      </Badge>
                    ))}
                    {segments.length > 3 && (
                      <Badge variant="outline">+{segments.length - 3} more</Badge>
                    )}
                  </div>
                  {segmentCountResult && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-1">Total Recipients</p>
                      <p className="text-2xl font-bold">
                        {segmentCountResult.totalNumberOfContacts || 0}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Description Tab */}
        <TabsContent value="description" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base whitespace-pre-wrap">
                {campaign.description || 'No description provided for this campaign.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audience Tab */}
        <TabsContent value="audience" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Audience Details</CardTitle>
                  <CardDescription>Segments and recipient information</CardDescription>
                </div>
                {segmentIds.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setSegmentCountDialogOpen(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Audience Count
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {segments.length > 0 ? (
                <>
                  <div>
                    <p className="text-sm font-medium mb-2">Selected Segments</p>
                    <div className="flex flex-wrap gap-2">
                      {segments.map((segment: any) => (
                        <Badge key={segment._id} variant="secondary" className="text-sm">
                          {segment.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {segmentCountResult && (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Segment Name</TableHead>
                            <TableHead className="text-center">Total Recipients</TableHead>
                            <TableHead className="text-center">Invalid Emails</TableHead>
                            <TableHead className="text-center">Unsubscribed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {segmentCountResult.segments?.map((seg: any, index: number) => {
                            const isLastRow = index === segmentCountResult.segments.length - 1;
                            return (
                              <React.Fragment key={seg.segmentId}>
                                <TableRow>
                                  <TableCell>{seg.segmentName}</TableCell>
                                  <TableCell className="text-center">{seg.contactCount}</TableCell>
                                  <TableCell className="text-center">{seg.invalidEmailCount}</TableCell>
                                  <TableCell className="text-center">{seg.unSubscribedCount}</TableCell>
                                </TableRow>
                                {!isLastRow && (
                                  <TableRow>
                                    <TableCell colSpan={4} className="text-center py-2">
                                      <Badge variant="outline">OR</Badge>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </React.Fragment>
                            );
                          })}
                          <TableRow className="bg-muted/50">
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-center font-bold">
                              {segmentCountResult.totalNumberOfContacts}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {segmentCountResult.totalInvalidEmailCount}
                            </TableCell>
                            <TableCell className="text-center font-bold">
                              {segmentCountResult.totalUnSubscribedCount}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No segments selected for this campaign</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          {campaignLogs.length > 0 ? (
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
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`${paths.dashboard.logs.detail}?campaignId=${id}&campaignName=${encodeURIComponent(campaign.campaignName || 'Campaign')}`)}
                    className="w-full"
                  >
                    View All Logs
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
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
        </TabsContent>
      </Tabs>

      {/* Segment Count Dialog */}
      {segmentIds.length > 0 && (
        <SegmentCountDialog
          open={segmentCountDialogOpen}
          onOpenChange={setSegmentCountDialogOpen}
          segmentIds={segmentIds}
        />
      )}
    </div>
  );
}
