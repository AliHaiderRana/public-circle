/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  RefreshCw,
  Mail,
  User,
  Clock,
  Loader2,
  XCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from "dayjs";
import {
  getCampaignRunEmails,
  getCampaignRunEmailsFromWarehouse,
  getCampaignMessageStats,
  resendCampaignEmails,
} from "@/actions/logs";
import { EmailAnalyticsChart } from "@/components/dashboard/email-analytics-chart";
import { AccountRestrictionDialog } from "@/components/campaign/AccountRestrictionDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuthContext } from "@/auth/hooks/use-auth-context";
import {
  isAccountRestricted,
  getRestrictionMessage,
} from "@/utils/account-restrictions";

// Event color mapping (matches old project: primary, success, info, warning, grey)
const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "Send":
      return "bg-primary";
    case "Delivery":
      return "bg-green-500";
    case "Open":
    case "Click":
      return "bg-blue-500";
    case "Bounce":
    case "Complaint":
    case "Reject":
      return "bg-gray-400";
    case "DeliveryDelay":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
};

const getLatestEventStatus = (emailEvents: any) => {
  if (!emailEvents) return { status: "Sent", color: "primary" };

  let latestEvent: string | null = null;
  let latestTimestamp: Date | null = null;

  Object.entries(emailEvents).forEach(
    ([eventType, eventData]: [string, any]) => {
      const timestamp =
        eventData?.[eventType.toLowerCase()]?.timestamp ||
        eventData?.deliveryDelay?.timestamp ||
        eventData?.click?.timestamp ||
        eventData?.open?.timestamp ||
        eventData?.delivery?.timestamp ||
        eventData?.mail?.timestamp;

      if (
        timestamp &&
        (!latestTimestamp || new Date(timestamp) > latestTimestamp)
      ) {
        latestTimestamp = new Date(timestamp);
        latestEvent = eventType;
      }
    },
  );

  switch (latestEvent) {
    case "Open":
    case "Click":
      return {
        status: latestEvent === "Open" ? "Opened" : "Clicked",
        color: "info",
      };
    case "Delivery":
      return { status: "Delivered", color: "success" };
    case "DeliveryDelay":
      return { status: "Delayed", color: "warning" };
    case "Bounce":
    case "Complaint":
    case "Reject":
      return {
        status:
          latestEvent === "Bounce"
            ? "Bounced"
            : latestEvent === "Complaint"
              ? "Complained"
              : "Rejected",
        color: "default",
      };
    default:
      return { status: "Sent", color: "primary" };
  }
};

const formatDate = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

const formatTime = (date: string | Date | null | undefined) => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

interface EmailLog {
  _id: string;
  toEmailAddress: string;
  fromEmailAddress: string;
  cc?: Array<{ toEmailAddress: string }>;
  bcc?: Array<{ toEmailAddress: string }>;
  emailEvents?: Record<string, any>;
  createdAt: string;
  resendCount?: number;
  resent?: Array<any>;
}

interface StatsData {
  totalEmailsSent?: number;
  totalEmailsDelivered?: number;
  totalEmailsOpened?: number;
  totalEmailsClicked?: number;
  totalEmailsFailed?: number;
  totalEmailsDelayed?: number;
  totalResendEmails?: number;
  graphData?: Record<string, number>;
}

export default function CampaignMessagesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get run ID and campaign info from location state or search params
  const runId = (location.state as any)?.runId || searchParams.get("runId");
  const campaignId =
    (location.state as any)?.campaignId || searchParams.get("campaignId");
  const campaignName =
    (location.state as any)?.campaignName ||
    searchParams.get("campaignName") ||
    "Campaign";
  const isDataStoredOnWarehouse = Boolean(
    (location.state as any)?.isDataStoredOnWarehouse,
  );

  // State management
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isEmailsLoading, setIsEmailsLoading] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    isDataStoredOnWarehouse ? 100 : 10,
  );
  const [totalCount, setTotalCount] = useState(0);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "daily" | "monthly" | "yearly"
  >("daily");
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());

  // Email selection state
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isSelectAllVisible, setIsSelectAllVisible] = useState(false);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);

  // Resend confirmation state
  const [resendConfirmOpen, setResendConfirmOpen] = useState(false);
  const [resendingEmails, setResendingEmails] = useState<string[]>([]);
  const [isResending, setIsResending] = useState(false);

  // Warehouse state
  const [hasRequestedWarehouse, setHasRequestedWarehouse] = useState(
    !isDataStoredOnWarehouse,
  );
  const [warehouseFetchError, setWarehouseFetchError] = useState<string | null>(
    null,
  );

  // Recipients dialog state
  const [recipientsDialogOpen, setRecipientsDialogOpen] = useState(false);
  const [dialogRecipients, setDialogRecipients] = useState<
    Array<{ toEmailAddress: string }>
  >([]);
  const [dialogTitle, setDialogTitle] = useState("");

  // Account restriction state
  const { user } = useAuthContext();
  const isRestricted = isAccountRestricted(user);
  const restrictionMessage = getRestrictionMessage(user);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (runId) {
      fetchEmails();
      fetchDashboardStatsCounts();
    } else {
      toast.error("Campaign run ID is required");
      navigate(-1);
    }
  }, [
    runId,
    page,
    rowsPerPage,
    selectedWidget,
    isDataStoredOnWarehouse,
    hasRequestedWarehouse,
  ]);

  useEffect(() => {
    if (isDataStoredOnWarehouse && rowsPerPage > 100) {
      setRowsPerPage(100);
      setPage(0);
    }
  }, [isDataStoredOnWarehouse, rowsPerPage]);

  useEffect(() => {
    fetchDashboardStatsCounts();
  }, [selectedPeriod, selectedDate, runId]);

  const fetchEmails = async () => {
    if (!runId) {
      setLogs([]);
      setTotalCount(0);
      return;
    }

    const shouldUseWarehouse = isDataStoredOnWarehouse;
    if (shouldUseWarehouse && !hasRequestedWarehouse) {
      setLogs([]);
      setTotalCount(0);
      return;
    }

    setIsEmailsLoading(true);
    setWarehouseFetchError(null);

    try {
      const pageSize = shouldUseWarehouse
        ? Math.min(rowsPerPage, 100)
        : rowsPerPage;
      const params = `${runId}?pageNumber=${page + 1}&pageSize=${pageSize}${selectedWidget ? `&filter=${selectedWidget}` : ""}`;

      const res = shouldUseWarehouse
        ? await getCampaignRunEmailsFromWarehouse(params)
        : await getCampaignRunEmails(params);

      if (res?.status === 200) {
        const payload = res?.data?.data;
        const normalizedTotal = Number(payload?.totalRecords) || 0;
        setTotalCount(normalizedTotal);
        setLogs(Array.isArray(payload?.items) ? payload.items : []);
        setWarehouseFetchError(null);
      } else {
        setLogs([]);
        setTotalCount(0);
        if (shouldUseWarehouse) {
          setWarehouseFetchError(
            "Unable to load warehouse emails. Please try again.",
          );
        }
      }
    } catch (error: any) {
      console.error("Error fetching campaign run emails:", error);
      setLogs([]);
      setTotalCount(0);
      if (shouldUseWarehouse) {
        const errorMessage =
          error?.response?.data?.errorMessage ||
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load warehouse emails. Please try again later.";
        setWarehouseFetchError(errorMessage);
      }
    } finally {
      setIsEmailsLoading(false);
    }
  };

  const fetchDashboardStatsCounts = async () => {
    if (!runId) {
      setStats(null);
      return;
    }

    setIsStatsLoading(true);
    try {
      const params = {
        graphScope: {
          ...(selectedPeriod === "yearly" && { yearly: 10 }),
          ...(selectedPeriod === "monthly" && {
            monthly: { year: selectedDate.year() },
          }),
          ...(selectedPeriod === "daily" && {
            daily: {
              month: selectedDate.format("MMM"),
              year: selectedDate.year(),
            },
          }),
        },
      };

      const res = await getCampaignMessageStats(runId, params);
      if (res?.status === 200) {
        setStats(res?.data?.data);
      }
    } catch (error) {
      console.error("Error fetching campaign message stats:", error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isDataStoredOnWarehouse && !hasRequestedWarehouse) {
        setHasRequestedWarehouse(true);
      } else {
        await fetchEmails();
      }
      await fetchDashboardStatsCounts();
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setIsSelectAll(checked);
    setIsSelectAllVisible(false);
    setSelectedEmailIds([]);
  };

  const handleSelectAllVisible = (checked: boolean) => {
    setIsSelectAllVisible(checked);
    setIsSelectAll(false);
    if (checked) {
      setSelectedEmailIds(logs.map((log) => log._id));
    } else {
      setSelectedEmailIds([]);
    }
  };

  const handleIndividualEmailToggle = (emailId: string) => {
    setSelectedEmailIds((prev) =>
      prev.includes(emailId)
        ? prev.filter((id) => id !== emailId)
        : [...prev, emailId],
    );
    if (isSelectAll || isSelectAllVisible) {
      setIsSelectAll(false);
      setIsSelectAllVisible(false);
    }
  };

  const isEmailChecked = (emailId: string) => {
    if (isSelectAll) return true;
    if (isSelectAllVisible) return selectedEmailIds.includes(emailId);
    return selectedEmailIds.includes(emailId);
  };

  const handleResend = async () => {
    // Check account restrictions before allowing resend
    if (isRestricted) {
      setStatusOpen(true);
      return;
    }

    if (!runId) {
      toast.error("Campaign run ID not found");
      return;
    }

    try {
      const eventTypeMap: Record<string, string> = {
        emailsResent: "Send",
        emailsOpened: "Open",
        emailsFailed: "Bounce",
        emailsDelivered: "Delivery",
        emailsDelayed: "DeliveryDelay",
        emailsSent: "Send",
      };

      const eventType = eventTypeMap[selectedWidget || "emailsSent"];
      if (!eventType) {
        toast.error("Invalid event type selected");
        return;
      }

      let toEmailAddresses: string[] = [];

      if (isSelectAll) {
        toEmailAddresses = [];
      } else if (isSelectAllVisible) {
        toEmailAddresses = logs
          .filter((log) => selectedEmailIds.includes(log._id))
          .map((log) => log.toEmailAddress);
      } else {
        toEmailAddresses = logs
          .filter((log) => selectedEmailIds.includes(log._id))
          .map((log) => log.toEmailAddress);
      }

      if (toEmailAddresses.length === 0 && !isSelectAll) {
        toast.error("No emails selected for resend");
        return;
      }

      setResendingEmails(toEmailAddresses);
      setResendConfirmOpen(true);
    } catch (error) {
      console.error("Error preparing resend:", error);
      toast.error("Failed to prepare resend");
    }
  };

  const handleConfirmResend = async () => {
    if (!runId || !campaignId) {
      toast.error("Invalid resend state");
      return;
    }

    try {
      setIsResending(true);

      const eventTypeMap: Record<string, string> = {
        emailsResent: "Send",
        emailsOpened: "Open",
        emailsFailed: "Bounce",
        emailsDelivered: "Delivery",
        emailsDelayed: "DeliveryDelay",
        emailsSent: "Send",
      };

      const eventType = eventTypeMap[selectedWidget || "emailsSent"];

      const payload = {
        campaignId,
        campaignRunId: runId,
        toEmailAddresses: resendingEmails,
        eventType,
      };

      const res = await resendCampaignEmails(payload);

      if (res?.status === 200) {
        toast.success(
          `Successfully resending ${isSelectAll ? totalCount : resendingEmails.length} email(s)`,
        );
        setIsSelectAll(false);
        setIsSelectAllVisible(false);
        setSelectedEmailIds([]);
        setResendingEmails([]);
        setResendConfirmOpen(false);

        setTimeout(async () => {
          await fetchDashboardStatsCounts();
          await fetchEmails();
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error resending emails:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to resend emails";
      toast.error(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleLoadWarehouseData = () => {
    setWarehouseFetchError(null);
    if (isDataStoredOnWarehouse && !hasRequestedWarehouse) {
      setHasRequestedWarehouse(true);
      setPage(0);
    } else {
      fetchEmails();
    }
  };

  const handleOpenRecipientsDialog = (
    recipients: Array<{ toEmailAddress: string }>,
    title: string,
  ) => {
    setDialogRecipients(recipients);
    setDialogTitle(title);
    setRecipientsDialogOpen(true);
  };

  const handleWidgetClick = (widgetKey: string) => {
    setSelectedWidget((prev) => (prev === widgetKey ? null : widgetKey));
    setPage(0);
  };

  const formatChartData = (data: Record<string, number> | undefined) => {
    if (!data) return { categories: [], series: [] };

    const categories = Object.keys(data);
    const values = Object.values(data);

    return {
      categories,
      series: [
        {
          name: "Emails Sent",
          data: values,
        },
      ],
    };
  };

  const handlePeriodChange = (newPeriod: "daily" | "monthly" | "yearly") => {
    setSelectedPeriod(newPeriod);
  };

  if (!runId) {
    return (
      <div className="space-y-6">
        <EmptyState
          title="Campaign Run ID Required"
          description="Please select a campaign run to view messages."
          onAction={() => navigate(-1)}
          actionLabel="Go Back"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {campaignName} Emails
            </h1>
            <p className="text-muted-foreground mt-1">
              View individual email delivery logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedWidget && (
            <Badge
              variant="outline"
              className="cursor-pointer"
              onClick={() => setSelectedWidget(null)}
            >
              {selectedWidget === "emailsResent"
                ? "Re-sents"
                : selectedWidget.replace("emails", "").trim()}
              <XCircle className="ml-2 h-3 w-3" />
            </Badge>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", isRefreshing && "animate-spin")}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Statistics Widgets */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <button
              onClick={() => handleWidgetClick("emailsSent")}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                selectedWidget === "emailsSent"
                  ? "border-primary shadow-md"
                  : "border-border",
              )}
            >
              <div className="text-2xl font-bold text-muted-foreground">
                {stats?.totalEmailsSent || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Total Sent
              </div>
            </button>

            <button
              onClick={() => handleWidgetClick("emailsDelivered")}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                selectedWidget === "emailsDelivered"
                  ? "border-primary shadow-md"
                  : "border-border",
              )}
            >
              <div className="text-2xl font-bold text-green-600">
                {stats?.totalEmailsDelivered || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Delivered
              </div>
            </button>

            <button
              onClick={() => handleWidgetClick("emailsOpened")}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                selectedWidget === "emailsOpened"
                  ? "border-primary shadow-md"
                  : "border-border",
              )}
            >
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalEmailsOpened || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Opened</div>
            </button>

            <button
              onClick={() => handleWidgetClick("emailsFailed")}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                selectedWidget === "emailsFailed"
                  ? "border-primary shadow-md"
                  : "border-border",
              )}
            >
              <div className="text-2xl font-bold text-red-600">
                {stats?.totalEmailsFailed || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Failed</div>
            </button>

            <button
              onClick={() => handleWidgetClick("emailsDelayed")}
              className={cn(
                "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                selectedWidget === "emailsDelayed"
                  ? "border-primary shadow-md"
                  : "border-border",
              )}
            >
              <div className="text-2xl font-bold text-yellow-600">
                {stats?.totalEmailsDelayed || 0}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Delayed</div>
            </button>

            {!isDataStoredOnWarehouse && (
              <button
                onClick={() => handleWidgetClick("emailsResent")}
                className={cn(
                  "p-4 rounded-lg border text-left transition-all hover:shadow-md",
                  selectedWidget === "emailsResent"
                    ? "border-primary shadow-md"
                    : "border-border",
                )}
              >
                <div className="text-2xl font-bold text-muted-foreground">
                  {stats?.totalResendEmails || 0}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Re-sent
                </div>
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Chart */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="analytics">
          <AccordionTrigger className="px-6">
            <CardTitle>Sent Emails Analytics</CardTitle>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent>
              <EmailAnalyticsChart
                title=""
                subheader={`${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Email Distribution`}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={handlePeriodChange}
                loading={isStatsLoading}
                chart={
                  isStatsLoading
                    ? { categories: [], series: [] }
                    : formatChartData(stats?.graphData)
                }
              />
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Resend Controls */}
      {!isDataStoredOnWarehouse && (
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={isSelectAll}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all" className="cursor-pointer">
                Select All
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-visible"
                checked={isSelectAllVisible}
                onCheckedChange={handleSelectAllVisible}
              />
              <Label htmlFor="select-visible" className="cursor-pointer">
                Select Visible
              </Label>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      onClick={handleResend}
                      disabled={
                        isRestricted ||
                        (!isSelectAll &&
                          !isSelectAllVisible &&
                          selectedEmailIds.length === 0) ||
                        isResending
                      }
                    >
                      {isResending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Resend to{" "}
                          {isSelectAll
                            ? totalCount
                            : selectedEmailIds.length}{" "}
                          contacts
                        </>
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                {isRestricted && (
                  <TooltipContent>
                    <p>
                      {restrictionMessage ||
                        "Account restrictions prevent resending emails"}
                    </p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Email List */}
      <Card>
        <CardContent className="pt-6">
          {isEmailsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: rowsPerPage }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            isDataStoredOnWarehouse ? (
              <EmptyState
                title="No warehouse emails found"
                description={
                  <div className="space-y-3">
                    <p>
                      Older campaign data has been moved to our long-term
                      archive (Warehouse). You can request this data to view
                      your archived email logs.
                    </p>
                    {warehouseFetchError && (
                      <p className="text-destructive text-sm">
                        {warehouseFetchError}
                      </p>
                    )}
                    <Button
                      onClick={handleLoadWarehouseData}
                      disabled={isEmailsLoading}
                    >
                      {hasRequestedWarehouse
                        ? "Retry loading warehouse data"
                        : "Request to view data"}
                    </Button>
                  </div>
                }
              />
            ) : (
              <EmptyState
                title="No logs found"
                description="No email logs available for this campaign run."
              />
            )
          ) : (
            <Accordion type="multiple" className="w-full">
              {logs.map((log) => {
                const latestStatus = getLatestEventStatus(log.emailEvents);
                return (
                  <AccordionItem key={log._id} value={log._id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {!isDataStoredOnWarehouse && (
                            <Checkbox
                              checked={isEmailChecked(log._id)}
                              onCheckedChange={() =>
                                handleIndividualEmailToggle(log._id)
                              }
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            To: {log.toEmailAddress}
                          </span>
                          {log.cc && log.cc.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRecipientsDialog(
                                        log.cc || [],
                                        "CC Recipients",
                                      );
                                    }}
                                  >
                                    CC: {log.cc.length}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-1 text-left">
                                    {log.cc.slice(0, 10).map((email, index) => (
                                      <div key={index} className="text-xs">
                                        {email.toEmailAddress}
                                      </div>
                                    ))}
                                    {log.cc.length > 10 && (
                                      <Badge
                                        variant="secondary"
                                        className="mt-1 text-xs cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenRecipientsDialog(
                                            log.cc || [],
                                            "CC Recipients",
                                          );
                                        }}
                                      >
                                        +{log.cc.length - 10} more
                                      </Badge>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {log.bcc && log.bcc.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenRecipientsDialog(
                                        log.bcc || [],
                                        "BCC Recipients",
                                      );
                                    }}
                                  >
                                    BCC: {log.bcc.length}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent onClick={(e) => e.stopPropagation()}>
                                  <div className="space-y-1 text-left">
                                    {log.bcc
                                      .slice(0, 10)
                                      .map((email, index) => (
                                        <div key={index} className="text-xs">
                                          {email.toEmailAddress}
                                        </div>
                                      ))}
                                    {log.bcc.length > 10 && (
                                      <Badge
                                        variant="secondary"
                                        className="mt-1 text-xs cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenRecipientsDialog(
                                            log.bcc || [],
                                            "BCC Recipients",
                                          );
                                        }}
                                      >
                                        +{log.bcc.length - 10} more
                                      </Badge>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {log.resendCount && log.resendCount > 0 && (
                            <Badge variant="outline">
                              Re-sent: {log.resendCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Sent at {formatDate(log.createdAt)}</span>
                          </div>
                          <Badge variant={latestStatus.color as any}>
                            {latestStatus.status}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Email Details */}
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">From:</span>
                          <span>{log.fromEmailAddress}</span>
                        </div>

                        <div className="border-t pt-4">
                          <h4 className="text-sm font-semibold mb-3">
                            Email Event Timeline
                          </h4>
                          <div className="space-y-3">
                            {log.emailEvents &&
                              Object.entries(log.emailEvents).map(
                                ([eventType, eventData]: [string, any]) => {
                                  const timestamp =
                                    eventData?.[eventType.toLowerCase()]
                                      ?.timestamp ||
                                    eventData?.deliveryDelay?.timestamp ||
                                    eventData?.click?.timestamp ||
                                    eventData?.open?.timestamp ||
                                    eventData?.delivery?.timestamp ||
                                    eventData?.mail?.timestamp;

                                  return (
                                    <div
                                      key={eventType}
                                      className="flex items-start gap-3"
                                    >
                                      <div
                                        className={cn(
                                          "mt-1 h-2 w-2 rounded-full",
                                          getEventColor(eventType),
                                        )}
                                      />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium">
                                          Email {eventType}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {formatDate(timestamp)}{" "}
                                          {formatTime(timestamp)}
                                        </div>
                                        {eventData?.deliveryDelay
                                          ?.delayType && (
                                          <div className="text-xs text-yellow-600 mt-1">
                                            Delay:{" "}
                                            {eventData.deliveryDelay.delayType}
                                          </div>
                                        )}
                                        {eventData?.bounce?.bounceType && (
                                          <div className="text-xs text-red-600 mt-1">
                                            Bounce:{" "}
                                            {eventData.bounce.bounceType} -{" "}
                                            {eventData.bounce.bounceSubType}
                                          </div>
                                        )}
                                        {eventData?.complaint
                                          ?.complaintFeedbackType && (
                                          <div className="text-xs text-red-600 mt-1">
                                            Complaint:{" "}
                                            {
                                              eventData.complaint
                                                .complaintFeedbackType
                                            }
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                          </div>
                        </div>

                        {/* Resend History */}
                        {log.resent && log.resent.length > 0 && (
                          <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">
                              Re-sent History
                            </h4>
                            <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                              {log.resent
                                .filter(
                                  (resentLog: any) =>
                                    resentLog.emailEvents &&
                                    Object.keys(resentLog.emailEvents).length >
                                      0,
                                )
                                .map((resentLog: any, index: number) => (
                                  <div key={index} className="space-y-2">
                                    {Object.entries(resentLog.emailEvents).map(
                                      ([eventType, eventData]: [
                                        string,
                                        any,
                                      ]) => {
                                        const timestamp =
                                          eventData?.[eventType.toLowerCase()]
                                            ?.timestamp ||
                                          eventData?.deliveryDelay?.timestamp ||
                                          eventData?.click?.timestamp ||
                                          eventData?.open?.timestamp ||
                                          eventData?.delivery?.timestamp ||
                                          eventData?.mail?.timestamp;

                                        return (
                                          <div
                                            key={eventType}
                                            className="flex items-start gap-3"
                                          >
                                            <div
                                              className={cn(
                                                "mt-1 h-2 w-2 rounded-full",
                                                getEventColor(eventType),
                                              )}
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-medium">
                                                Email {eventType}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {formatDate(timestamp)}{" "}
                                                {formatTime(timestamp)}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      },
                                    )}
                                    {index < log.resent.length - 1 && (
                                      <div className="border-t my-2" />
                                    )}
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {page * rowsPerPage + 1} to{" "}
                {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount}{" "}
                emails
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={rowsPerPage.toString()}
                  onValueChange={(value) => {
                    const nextValue = parseInt(value, 10);
                    const sanitizedValue = isDataStoredOnWarehouse
                      ? Math.min(nextValue, 100)
                      : nextValue;
                    setRowsPerPage(sanitizedValue);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isDataStoredOnWarehouse
                      ? [5, 10, 25, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} per page
                          </SelectItem>
                        ))
                      : [5, 10, 25, 50, 100, 200, 300, 400, 500].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} per page
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(totalCount / rowsPerPage) - 1, p + 1),
                    )
                  }
                  disabled={page >= Math.ceil(totalCount / rowsPerPage) - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resend Confirmation Dialog */}
      <Dialog open={resendConfirmOpen} onOpenChange={setResendConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Email Resend</DialogTitle>
            <DialogDescription>
              This email will be resent to{" "}
              <strong>
                {isSelectAll ? totalCount : resendingEmails.length}
              </strong>{" "}
              contact
              {isSelectAll
                ? totalCount !== 1
                  ? "s"
                  : ""
                : resendingEmails.length !== 1
                  ? "s"
                  : ""}
              . Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResendConfirmOpen(false)}
              disabled={isResending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmResend} disabled={isResending}>
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resending...
                </>
              ) : (
                "Confirm Resend"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipients Dialog */}
      <Dialog
        open={recipientsDialogOpen}
        onOpenChange={setRecipientsDialogOpen}
      >
        <DialogContent className="max-w-md max-h-[600px]">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {dialogRecipients.map((email, index) => (
              <div key={index} className="text-sm py-1">
                {email.toEmailAddress}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setRecipientsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Restriction Dialog */}
      <AccountRestrictionDialog
        open={statusOpen}
        onOpenChange={setStatusOpen}
        restrictionType="ses"
        message={
          restrictionMessage ||
          "Your account has restrictions that prevent this action."
        }
      />
    </div>
  );
}
