import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import dayjs from "dayjs";
import { runCampaign, getCampaignIdCompany, getCampaignById, updateCampaign } from "@/actions/campaign";
import { getAllCampaignGroups, createGroup } from "@/actions/groups";
import { getAllTemplates, getTemplateById } from "@/actions/templates";
import { getAllSegments } from "@/actions/segments";
import { getAllVerifiedEmails } from "@/actions/configurations";
import { sendTestEmail } from "@/actions/filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { paths } from "@/routes/paths";
import {
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Eye,
  Send,
  Users,
  Mail,
  FileText,
  Sparkles,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import {
  FileAttachmentSection,
  type AttachmentFile,
} from "@/components/file-attachment/FileAttachmentSection";
import { TemplatePreviewDrawer } from "@/components/template-editor/TemplatePreviewDrawer";
import { SegmentCountDialog } from "@/components/campaign/SegmentCountDialog";
import { AdvancedSchedulingSection } from "@/components/campaign/AdvancedSchedulingSection";
import { AccountRestrictionDialog } from "@/components/campaign/AccountRestrictionDialog";
import { SegmentContactsDialog } from "@/components/segments/SegmentContactsDialog";

// Enhanced schema with all required fields
const campaignSchema = z
  .object({
    campaignCompanyId: z.string().min(1, "Campaign ID is required"),
    campaignName: z.string().min(1, "Campaign name is required").max(200),
    description: z.string().max(1000).optional(),
    companyGroupingId: z.string().min(1, "Group is required"),
    sourceEmailAddress: z
      .string()
      .email("Invalid email")
      .min(1, "From email is required"),
    emailSubject: z.string().min(1, "Subject is required").max(200),
    emailTemplateId: z.string().min(1, "Template is required"),
    segmentIds: z.array(z.string()).min(1, "At least one segment is required"),
    cc: z.array(z.string().email()).max(50, "Maximum 50 CC emails").optional(),
    bcc: z
      .array(z.string().email())
      .max(50, "Maximum 50 BCC emails")
      .optional(),
    frequency: z.enum(["ONE_TIME", "MANY_TIMES"]),
    runMode: z.enum(["INSTANT", "SCHEDULE"]),
    runSchedule: z.string().optional(),
    isRecurring: z.boolean(),
    isOnGoing: z.boolean(),
    recurringPeriod: z.string().optional(),
    durationValue: z.string().optional(),
    timeUnit: z.enum(["minute", "hour", "day", "month", "year"]).optional(),
    endDate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isRecurring && !data.durationValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duration is required for recurring campaigns",
        path: ["durationValue"],
      });
    }
    if (data.runMode === "SCHEDULE" && !data.runSchedule) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Schedule date/time is required",
        path: ["runSchedule"],
      });
    }
  });

type CampaignFormValues = z.infer<typeof campaignSchema>;

export default function CampaignCreatePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [isPageLoading, setIsPageLoading] = useState(isEditMode);
  const [campaign, setCampaign] = useState<any>(null);
  const [campaignCompanyId, setCampaignCompanyId] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedSegments, setSelectedSegments] = useState<any[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [bccEmails, setBccEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState("");
  const [bccInput, setBccInput] = useState("");
  const [durationValue, setDurationValue] = useState("");
  const [timeUnit, setTimeUnit] = useState<
    "minute" | "hour" | "day" | "month" | "year"
  >("hour");
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmails, setTestEmails] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [verifiedEmailOpen, setVerifiedEmailOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [segmentCountDialogOpen, setSegmentCountDialogOpen] = useState(false);
  const [segmentContactsDialogId, setSegmentContactsDialogId] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [groupOpen, setGroupOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [restrictionDialogOpen, setRestrictionDialogOpen] = useState(false);
  const [restrictionType, setRestrictionType] = useState<'bandwidth' | 'email'>('bandwidth');
  const [restrictionMessage, setRestrictionMessage] = useState<string | undefined>(undefined);

  const { allGroups, isLoading: groupsLoading } = getAllCampaignGroups();
  const { tempTemplates, templatesLoading } = getAllTemplates();
  const { allSegments, isLoading: segmentsLoading } = getAllSegments();
  const { verifiedEmails, isLoading: verifiedEmailsLoading } =
    getAllVerifiedEmails();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      campaignCompanyId: "",
      campaignName: "",
      description: "",
      companyGroupingId: "",
      sourceEmailAddress: "",
      emailSubject: "",
      emailTemplateId: "",
      segmentIds: [],
      cc: [],
      bcc: [],
      frequency: "ONE_TIME",
      runMode: "INSTANT",
      runSchedule: undefined,
      isRecurring: false,
      isOnGoing: false,
      recurringPeriod: undefined,
      durationValue: "",
      timeUnit: "hour",
    },
  });

  const watchRunMode = form.watch("runMode");
  const watchIsRecurring = form.watch("isRecurring");
  const watchIsOnGoing = form.watch("isOnGoing");
  const watchFrequency = form.watch("frequency");

  // Fetch campaign data in edit mode or generate ID in create mode
  useEffect(() => {
    const initializePage = async () => {
      if (isEditMode && id) {
        // Edit mode - fetch campaign data
        setIsPageLoading(true);
        try {
          const response = await getCampaignById(id);
          if (response?.status === 200 && response.data?.data) {
            const campaignData = response.data.data;
            setCampaign(campaignData);

            // Set campaign company ID
            setCampaignCompanyId(campaignData.campaignCompanyId || "");

            // Parse recurring period
            let duration = "";
            let unit: "minute" | "hour" | "day" | "month" | "year" = "hour";
            if (campaignData.recurringPeriod) {
              const parts = campaignData.recurringPeriod.split(" ");
              duration = parts[0] || "";
              unit = (parts[1] as typeof unit) || "hour";
            }
            setDurationValue(duration);
            setTimeUnit(unit);

            // Set CC/BCC emails
            setCcEmails(campaignData.cc || []);
            setBccEmails(campaignData.bcc || []);

            // Fetch and set template
            if (campaignData.emailTemplate || campaignData.emailTemplateId) {
              const templateId = campaignData.emailTemplate || campaignData.emailTemplateId;
              const templateRes = await getTemplateById(templateId);
              if (templateRes?.status === 200) {
                setSelectedTemplate(templateRes.data.data);
              }
            }

            // Set segments
            const segmentIds = campaignData.segments?.map((s: any) => s._id || s) || [];
            const segments = allSegments?.filter((s: any) => segmentIds.includes(s._id)) || [];
            setSelectedSegments(segments);

            // Set attachments
            if (campaignData.attachments && Array.isArray(campaignData.attachments)) {
              const attachmentFiles: AttachmentFile[] = campaignData.attachments.map((att: any) => ({
                id: att._id || att.id,
                name: att.originalName || att.name || "Unknown",
                size: att.size || 0,
                type: att.contentType || att.type || "application/octet-stream",
                uploaded: true,
                uploading: false,
                progress: 100,
              }));
              setAttachments(attachmentFiles);
            }

            // Format run schedule
            let runSchedule = "";
            if (campaignData.runSchedule) {
              runSchedule = dayjs(campaignData.runSchedule).format("YYYY-MM-DDTHH:mm");
            }

            // Determine run mode and frequency
            const runMode = campaignData.runSchedule ? "SCHEDULE" : "INSTANT";
            const frequency = campaignData.frequency === "MANY_TIMES" ? "MANY_TIMES" : "ONE_TIME";

            // Set end date if available
            let endDateValue: string | undefined = undefined;
            if (campaignData.endDate) {
              endDateValue = dayjs(campaignData.endDate).format("YYYY-MM-DD");
              setEndDate(endDateValue);
            }

            // Reset form with campaign data
            form.reset({
              campaignCompanyId: campaignData.campaignCompanyId || "",
              campaignName: campaignData.campaignName || "",
              description: campaignData.description || "",
              companyGroupingId: campaignData.companyGroupingId?._id || campaignData.companyGroupingId || "",
              sourceEmailAddress: campaignData.sourceEmailAddress || "",
              emailSubject: campaignData.emailSubject || "",
              emailTemplateId: campaignData.emailTemplate || campaignData.emailTemplateId || "",
              segmentIds: segmentIds,
              cc: campaignData.cc || [],
              bcc: campaignData.bcc || [],
              frequency: frequency,
              runMode: runMode,
              runSchedule: runSchedule || undefined,
              isRecurring: campaignData.isRecurring || false,
              isOnGoing: campaignData.isOnGoing || false,
              recurringPeriod: campaignData.recurringPeriod || undefined,
              durationValue: duration,
              timeUnit: unit,
              endDate: endDateValue,
            });
          }
        } catch (error) {
          console.error("Error fetching campaign:", error);
          toast.error("Failed to load campaign data");
        } finally {
          setIsPageLoading(false);
        }
      } else {
        // Create mode - generate new campaign ID
        try {
          const res = await getCampaignIdCompany();
          if (res?.status === 200) {
            const newId = res.data?.data;
            setCampaignCompanyId(newId);
            form.setValue("campaignCompanyId", newId);
          }
        } catch (error) {
          console.error("Failed to auto-generate campaign ID:", error);
        }
      }
    };

    initializePage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, allSegments]);

  // Generate Campaign Company ID (manual regenerate)
  const handleGenerateId = async () => {
    try {
      const res = await getCampaignIdCompany();
      if (res?.status === 200) {
        const id = res.data?.data;
        setCampaignCompanyId(id);
        form.setValue("campaignCompanyId", id);
        toast.success("Campaign ID generated");
      }
    } catch (error: any) {
      toast.error("Failed to generate campaign ID");
    }
  };

  // Parse multiple emails from text (comma, semicolon, space, or newline separated)
  const parseEmails = (text: string): string[] => {
    return text
      .split(/[,;\s\n]+/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  // Handle CC email input
  const handleCcKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && ccInput.trim()) {
      e.preventDefault();
      addCcEmail(ccInput.trim());
    } else if (e.key === "Backspace" && !ccInput && ccEmails.length > 0) {
      removeCcEmail(ccEmails.length - 1);
    }
  };

  // Handle CC email paste
  const handleCcPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const emails = parseEmails(pastedText);

    if (emails.length === 0) {
      toast.error("No valid emails found in pasted text");
      return;
    }

    let addedCount = 0;
    const newEmails = [...ccEmails];

    for (const email of emails) {
      if (newEmails.length >= 50) {
        toast.error("Maximum 50 CC emails allowed");
        break;
      }
      if (!newEmails.includes(email)) {
        newEmails.push(email);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      setCcEmails(newEmails);
      form.setValue("cc", newEmails);
      toast.success(`Added ${addedCount} email${addedCount > 1 ? "s" : ""}`);
    }
    setCcInput("");
  };

  const addCcEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format");
      return;
    }
    if (ccEmails.includes(email)) {
      toast.error("Email already added");
      return;
    }
    if (ccEmails.length >= 50) {
      toast.error("Maximum 50 CC emails allowed");
      return;
    }
    const newEmails = [...ccEmails, email];
    setCcEmails(newEmails);
    form.setValue("cc", newEmails);
    setCcInput("");
  };

  const removeCcEmail = (index: number) => {
    const newEmails = ccEmails.filter((_, i) => i !== index);
    setCcEmails(newEmails);
    form.setValue("cc", newEmails);
  };

  // Handle BCC email input (same logic as CC)
  const handleBccKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && bccInput.trim()) {
      e.preventDefault();
      addBccEmail(bccInput.trim());
    } else if (e.key === "Backspace" && !bccInput && bccEmails.length > 0) {
      removeBccEmail(bccEmails.length - 1);
    }
  };

  // Handle BCC email paste
  const handleBccPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const emails = parseEmails(pastedText);

    if (emails.length === 0) {
      toast.error("No valid emails found in pasted text");
      return;
    }

    let addedCount = 0;
    const newEmails = [...bccEmails];

    for (const email of emails) {
      if (newEmails.length >= 50) {
        toast.error("Maximum 50 BCC emails allowed");
        break;
      }
      if (!newEmails.includes(email)) {
        newEmails.push(email);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      setBccEmails(newEmails);
      form.setValue("bcc", newEmails);
      toast.success(`Added ${addedCount} email${addedCount > 1 ? "s" : ""}`);
    }
    setBccInput("");
  };

  const addBccEmail = (email: string) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email format");
      return;
    }
    if (bccEmails.includes(email)) {
      toast.error("Email already added");
      return;
    }
    if (bccEmails.length >= 50) {
      toast.error("Maximum 50 BCC emails allowed");
      return;
    }
    const newEmails = [...bccEmails, email];
    setBccEmails(newEmails);
    form.setValue("bcc", newEmails);
    setBccInput("");
  };

  const removeBccEmail = (index: number) => {
    const newEmails = bccEmails.filter((_, i) => i !== index);
    setBccEmails(newEmails);
    form.setValue("bcc", newEmails);
  };

  // Handle test email
  const handleSendTest = async () => {
    if (!testEmails.trim()) {
      toast.error("Please enter at least one email address");
      return;
    }

    const emails = testEmails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    const invalidEmails = emails.filter(
      (e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e),
    );

    if (invalidEmails.length > 0) {
      toast.error("Please enter valid email addresses");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await sendTestEmail({
        sourceEmailAddress: form.getValues("sourceEmailAddress"),
        toEmailAddresses: emails.join(","),
        emailSubject: form.getValues("emailSubject"),
        emailTemplateId: form.getValues("emailTemplateId"),
      });

      if (res?.status === 200) {
        toast.success("Test email sent successfully");
        setTestEmailDialogOpen(false);
        setTestEmails("");
      } else {
        toast.error(res?.message || "Failed to send test email");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to send test email");
    } finally {
      setIsSendingTest(false);
    }
  };

  const onSubmit = async (data: CampaignFormValues) => {
    // Check if any files are still uploading
    const hasUploadingFiles = attachments.some((f) => f.uploading);
    if (hasUploadingFiles) {
      toast.error("Please wait for all files to finish uploading");
      return;
    }

    // Check if any files are not uploaded
    const hasUnuploadedFiles = attachments.some((f) => !f.uploaded);
    if (hasUnuploadedFiles) {
      toast.error("Please wait for all files to finish uploading");
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: any = {
        campaignName: data.campaignName,
        campaignCompanyId: data.campaignCompanyId,
        description: data.description,
        companyGroupingId: data.companyGroupingId,
        sourceEmailAddress: data.sourceEmailAddress,
        emailSubject: data.emailSubject,
        emailTemplateId: data.emailTemplateId,
        segmentIds: data.segmentIds,
        runMode: data.runMode,
        isRecurring: data.isRecurring,
        isOnGoing: data.isOnGoing,
        frequency: data.frequency,
      };

      // Only set status for new campaigns
      if (!isEditMode) {
        payload.status = "ACTIVE";
      }

      if (data.cc && data.cc.length > 0) {
        payload.cc = data.cc;
      }
      if (data.bcc && data.bcc.length > 0) {
        payload.bcc = data.bcc;
      }

      if (data.runMode === "SCHEDULE" && data.runSchedule) {
        payload.runSchedule = new Date(data.runSchedule).toISOString();
      }

      if (data.isRecurring && data.durationValue && data.timeUnit) {
        payload.recurringPeriod = `${data.durationValue} ${data.timeUnit}`;
      }

      // Note: endDate is stored but may need backend support
      if (data.endDate) {
        payload.endDate = new Date(data.endDate).toISOString();
      }

      // Add attachment IDs
      const attachmentIds = attachments
        .filter((f) => f.uploaded && !f.id.startsWith("temp-"))
        .map((f) => f.id);
      if (attachmentIds.length > 0) {
        payload.attachmentIds = attachmentIds;
      }

      // Call update or create based on mode
      const response = isEditMode && campaign
        ? await updateCampaign(campaign._id, payload)
        : await runCampaign(payload);

      if (response?.status === 200 || response?.data) {
        toast.success(isEditMode ? "Campaign updated successfully" : "Campaign created successfully");
        navigate(paths.dashboard.campaign.root);
      } else {
        if (response?.kind === "BANDWIDTH_LIMIT_REACHED") {
          setRestrictionType('bandwidth');
          setRestrictionMessage(response?.message);
          setRestrictionDialogOpen(true);
        } else if (response?.kind === "EMAIL_LIMIT_REACHED") {
          setRestrictionType('email');
          setRestrictionMessage(response?.message);
          setRestrictionDialogOpen(true);
        } else {
          toast.error(response?.message || `Failed to ${isEditMode ? "update" : "create"} campaign`);
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${isEditMode ? "update" : "create"} campaign`);
    }
  };

  const canSendTest =
    form.watch("sourceEmailAddress") &&
    form.watch("campaignName") &&
    form.watch("emailSubject") &&
    form.watch("emailTemplateId");

  // Show loading spinner while fetching campaign data in edit mode
  if (isPageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(isEditMode && id ? paths.dashboard.campaign.details(id) : paths.dashboard.campaign.root)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Campaign" : "Create Campaign"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditMode ? "Update campaign details and settings" : "Set up a new email campaign"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Single Card - Enter Content */}
          <Card>
            <CardHeader>
              <CardTitle>Enter Content</CardTitle>
              <CardDescription>
                This will be sent to the selected group of users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="campaignCompanyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign ID *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Campaign ID"
                          {...field}
                          value={campaignCompanyId || field.value}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleGenerateId}
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      Unique identifier for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="campaignName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Campaign name here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter campaign description here..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyGroupingId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Group *</FormLabel>
                    <Popover open={groupOpen} onOpenChange={setGroupOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? allGroups?.find(
                                  (g: any) => g._id === field.value,
                                )?.groupName || "Select group"
                              : "Select group"}
                            <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search groups..." />
                          <CommandList>
                            {groupsLoading && (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading...
                              </div>
                            )}
                            <CommandGroup>
                              {!showCreateGroup ? (
                                <>
                                  <CommandItem
                                    onSelect={() => setShowCreateGroup(true)}
                                    className="font-semibold text-primary"
                                  >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Group
                                  </CommandItem>
                                  {allGroups?.map((group: any) => (
                                    <CommandItem
                                      value={group.groupName || group.name}
                                      key={group._id}
                                      onSelect={() => {
                                        form.setValue(
                                          "companyGroupingId",
                                          group._id,
                                        );
                                        setGroupOpen(false);
                                      }}
                                    >
                                      {group.groupName || group.name}
                                    </CommandItem>
                                  ))}
                                </>
                              ) : (
                                <div className="p-2 space-y-2">
                                  <Input
                                    placeholder="Enter group name"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setShowCreateGroup(false);
                                        setNewGroupName("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={!newGroupName.trim() || isCreatingGroup}
                                      onClick={async () => {
                                        if (!newGroupName.trim()) return;
                                        setIsCreatingGroup(true);
                                        const res = await createGroup({
                                          groupName: newGroupName,
                                          type: "CAMPAIGN",
                                        });
                                        if (res?.status === 200) {
                                          const newGroup = res.data?.data;
                                          if (newGroup?._id) {
                                            form.setValue("companyGroupingId", newGroup._id);
                                          }
                                          setShowCreateGroup(false);
                                          setNewGroupName("");
                                          setGroupOpen(false);
                                        }
                                        setIsCreatingGroup(false);
                                      }}
                                    >
                                      {isCreatingGroup ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Saving...
                                        </>
                                      ) : (
                                        "Save"
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* From Email */}
              <FormField
                control={form.control}
                name="sourceEmailAddress"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>From Email *</FormLabel>
                    <Popover
                      open={verifiedEmailOpen}
                      onOpenChange={setVerifiedEmailOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value || "Select verified email"}
                            <Mail className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search emails..." />
                          <CommandList>
                            {verifiedEmailsLoading && (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                Loading...
                              </div>
                            )}
                            {!verifiedEmailsLoading && verifiedEmails?.length === 0 && (
                              <div className="py-6 text-center text-sm text-muted-foreground">
                                No verified emails found.
                              </div>
                            )}
                            {!verifiedEmailsLoading && verifiedEmails?.length > 0 && (
                              <CommandGroup>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {verifiedEmails?.map((email: any) => (
                                  <CommandItem
                                    value={email.emailAddress || email}
                                    key={email.emailAddress || email}
                                    onSelect={() => {
                                      const emailAddr =
                                        email.emailAddress || email;
                                      form.setValue(
                                        "sourceEmailAddress",
                                        emailAddr,
                                      );
                                      setVerifiedEmailOpen(false);
                                    }}
                                  >
                                    {email.emailAddress || email}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailSubject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="Write subject here..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emailTemplateId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Template *</FormLabel>
                    <div className="flex gap-2">
                      <Popover
                        open={templateOpen}
                        onOpenChange={setTemplateOpen}
                      >
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "flex-1 justify-between",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {selectedTemplate?.name || "Select template"}
                              <FileText className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search templates..." />
                            <CommandList>
                              {templatesLoading && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  Loading...
                                </div>
                              )}
                              {!templatesLoading && tempTemplates?.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                  No templates found.
                                </div>
                              )}
                              {!templatesLoading && tempTemplates?.length > 0 && (
                                <CommandGroup>
                                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                  {tempTemplates?.map((template: any) => (
                                    <CommandItem
                                      value={template.name}
                                      key={template._id}
                                      onSelect={async () => {
                                        const res = await getTemplateById(
                                          template._id,
                                        );
                                        if (res?.status === 200) {
                                          setSelectedTemplate(res.data.data);
                                          form.setValue(
                                            "emailTemplateId",
                                            template._id,
                                          );
                                          setTemplateOpen(false);
                                        }
                                      }}
                                    >
                                      {template.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (selectedTemplate) {
                            setPreviewDrawerOpen(true);
                          }
                        }}
                        disabled={!selectedTemplate}
                        title="Preview template"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CC & BCC Emails - Same Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CC Emails */}
                <div className="space-y-2">
                  <Label>CC</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[56px]">
                    {ccEmails.map((email, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeCcEmail(index)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      type="text"
                      placeholder={
                        ccEmails.length
                          ? ""
                          : "Enter CC emails, press Enter to add (max 50)"
                      }
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={handleCcKeyDown}
                      onPaste={handleCcPaste}
                      onBlur={() => {
                        if (ccInput.trim()) {
                          addCcEmail(ccInput.trim());
                        }
                      }}
                      className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(form.watch("cc") || []).length}/50 emails
                  </p>
                </div>

                {/* BCC Emails */}
                <div className="space-y-2">
                  <Label>BCC</Label>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[56px]">
                    {bccEmails.map((email, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeBccEmail(index)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      type="text"
                      placeholder={
                        bccEmails.length
                          ? ""
                          : "Enter BCC emails, press Enter to add (max 50)"
                      }
                      value={bccInput}
                      onChange={(e) => setBccInput(e.target.value)}
                      onKeyDown={handleBccKeyDown}
                      onPaste={handleBccPaste}
                      onBlur={() => {
                        if (bccInput.trim()) {
                          addBccEmail(bccInput.trim());
                        }
                      }}
                      className="flex-1 min-w-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(form.watch("bcc") || []).length}/50 emails
                  </p>
                </div>
              </div>

              {/* Segments */}
              <FormField
            control={form.control}
            name="segmentIds"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Segments *</FormLabel>
                <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                  <Popover open={segmentOpen} onOpenChange={setSegmentOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "flex-1 justify-start h-10",
                            field.value.length === 0 && "text-muted-foreground",
                          )}
                        >
                          <div className="flex gap-1 items-center flex-1 overflow-hidden">
                            {selectedSegments.length > 0 ? (
                              <>
                                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                {selectedSegments.map((segment: any) => (
                                  <Badge
                                    key={segment._id}
                                    variant="secondary"
                                    className="shrink-0"
                                  >
                                    {segment.name}
                                    <button
                                      type="button"
                                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const newValue = field.value.filter(
                                          (id) => id !== segment._id,
                                        );
                                        form.setValue("segmentIds", newValue);
                                        setSelectedSegments(
                                          selectedSegments.filter(
                                            (s: any) => s._id !== segment._id,
                                          ),
                                        );
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                                <span className="text-muted-foreground text-sm shrink-0">
                                  Select Segments
                                </span>
                              </>
                            ) : (
                              "Select Segments"
                            )}
                          </div>
                          <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Select Segment..." />
                        <CommandList>
                          {segmentsLoading && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Loading...
                            </div>
                          )}
                          {!segmentsLoading && allSegments?.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              No segments found.
                            </div>
                          )}
                          {!segmentsLoading && allSegments?.length > 0 && (
                            <CommandGroup>
                              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                              {allSegments?.map((segment: any) => {
                                const isSelected = field.value.includes(
                                  segment._id,
                                );
                                return (
                                  <CommandItem
                                    value={segment.name}
                                    key={segment._id}
                                    onSelect={() => {
                                      const newValue = isSelected
                                        ? field.value.filter(
                                            (id) => id !== segment._id,
                                          )
                                        : [...field.value, segment._id];
                                      form.setValue("segmentIds", newValue);
                                      setSelectedSegments(
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        allSegments.filter((s: any) =>
                                          newValue.includes(s._id),
                                        ),
                                      );
                                      setSegmentOpen(false);
                                    }}
                                  >
                                    {segment.name}
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => {
                        if (selectedSegments.length > 0) {
                          setSegmentContactsDialogId(selectedSegments[0]._id);
                        }
                      }}
                      disabled={selectedSegments.length === 0}
                    >
                      Segment Contacts
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10"
                      onClick={() => setSegmentCountDialogOpen(true)}
                      disabled={selectedSegments.length === 0}
                    >
                      Segment Audience Count
                    </Button>
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

              {/* Frequency */}
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ONE_TIME">One time</SelectItem>
                        <SelectItem value="MANY_TIMES">Every re-match</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <AdvancedSchedulingSection
                runMode={watchRunMode}
                runSchedule={form.watch("runSchedule")}
                isRecurring={watchIsRecurring}
                isOnGoing={watchIsOnGoing}
                recurringPeriod={form.watch("recurringPeriod")}
                durationValue={durationValue}
                timeUnit={timeUnit}
                endDate={endDate}
                onRunModeChange={(mode) => {
                  form.setValue("runMode", mode);
                  if (mode === "SCHEDULE" && !form.getValues("runSchedule")) {
                    const defaultSchedule = dayjs().add(5, "minute").format("YYYY-MM-DDTHH:mm");
                    form.setValue("runSchedule", defaultSchedule);
                  }
                }}
                onRunScheduleChange={(schedule) =>
                  form.setValue("runSchedule", schedule)
                }
                onRecurringChange={(recurring) => {
                  form.setValue("isRecurring", recurring);
                  if (recurring) {
                    form.setValue("isOnGoing", false);
                  }
                }}
                onOngoingChange={(ongoing) => {
                  form.setValue("isOnGoing", ongoing);
                  if (ongoing) {
                    form.setValue("isRecurring", false);
                    setEndDate(undefined);
                  }
                }}
                onDurationChange={(val) => {
                  setDurationValue(val);
                  form.setValue("durationValue", val);
                }}
                onTimeUnitChange={(unit) => {
                  setTimeUnit(unit);
                  form.setValue("timeUnit", unit);
                }}
                onEndDateChange={(date) => {
                  setEndDate(date);
                  form.setValue("endDate", date);
                }}
              />

            </CardContent>
          </Card>

          {/* Attachments - Sub-card like in old project */}
          <FileAttachmentSection
            onFilesChange={setAttachments}
            maxFiles={3}
            allowedTypes={["png", "pdf", "doc", "docx", "xls", "xlsx"]}
            initialFiles={attachments}
            disabled={false}
          />

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTestEmailDialogOpen(true)}
              disabled={!canSendTest}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Test
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(paths.dashboard.campaign.root)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting || isPageLoading}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditMode ? "Update Campaign" : "Create Campaign"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter email addresses to send a test email
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email Addresses</Label>
              <Textarea
                placeholder="Enter email addresses separated by commas"
                value={testEmails}
                onChange={(e) => setTestEmails(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emails with commas
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={isSendingTest || !testEmails.trim()}
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Drawer */}
      <TemplatePreviewDrawer
        open={previewDrawerOpen}
        onOpenChange={setPreviewDrawerOpen}
        templateId={selectedTemplate?._id}
      />

      {/* Segment Count Dialog */}
      <SegmentCountDialog
        open={segmentCountDialogOpen}
        onOpenChange={setSegmentCountDialogOpen}
        segmentIds={form.watch("segmentIds")}
      />

      {/* Account Restriction Dialog */}
      <AccountRestrictionDialog
        open={restrictionDialogOpen}
        onOpenChange={setRestrictionDialogOpen}
        restrictionType={restrictionType}
        message={restrictionMessage}
      />

      {/* Segment Contacts Dialog */}
      {segmentContactsDialogId && (
        <SegmentContactsDialog
          segmentId={segmentContactsDialogId}
          onClose={() => setSegmentContactsDialogId(null)}
        />
      )}
    </div>
  );
}
