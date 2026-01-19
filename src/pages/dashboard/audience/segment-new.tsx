import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import {
  getSegmentById,
  createSegment,
  updateSegment,
  getUserCount,
} from '@/actions/segments';
import { getAllFilters } from '@/actions/filters';
import { paths } from '@/routes/paths';
import type { Filter, SegmentFilter, FilterCondition, MatchType } from '@/types/segment';
import { SegmentFilterBuilder } from '@/components/segments/SegmentFilterBuilder';
import { SelectedFiltersList } from '@/components/segments/SelectedFiltersList';

const segmentSchema = z.object({
  segmentName: z.string().min(1, 'Segment name is required'),
});

type SegmentFormValues = z.infer<typeof segmentSchema>;

export default function SegmentNewPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!id;
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [segment, setSegment] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<Filter[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<SegmentFilter[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const { allFilters } = getAllFilters();
  const initialSegment = (location.state as any)?.segment;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SegmentFormValues>({
    resolver: zodResolver(segmentSchema),
    defaultValues: {
      segmentName: '',
    },
  });

  const segmentName = watch('segmentName');

  // Load segment data if editing
  useEffect(() => {
    const fetchSegmentData = async () => {
      const segmentId = id || initialSegment?._id;
      if (segmentId && allFilters) {
        setIsLoading(true);
        try {
          const response = await getSegmentById(segmentId);
          if (response?.status === 200) {
            const segmentData = response.data?.data;
            setValue('segmentName', segmentData?.name || '');
            setSegment(segmentData);

            // Match filters to filter definitions
            const matchedFields = (segmentData?.filters || [])
              .map((f: any) => {
                const fid = f.fieldId ?? null;
                let matchedFilter = (allFilters || []).find((af: Filter) => af._id === fid);
                if (!matchedFilter) {
                  const possibleKey = f.key || f.fieldKey || f.filterKey || null;
                  if (possibleKey) {
                    matchedFilter = (allFilters || []).find(
                      (af: Filter) => af.filterKey === possibleKey
                    );
                  }
                }
                return matchedFilter;
              })
              .filter(Boolean);

            setSelectedFields(matchedFields);

            // Transform filters to selectedGroups format
            const transformedGroups = (segmentData?.filters || []).map((f: any) => ({
              fieldId: f.fieldId,
              key: f.key,
              name: f.name,
              values: f.values || [],
              conditions: f.conditions || [],
              operator: f.operator || 'AND',
              type: f.type,
            }));

            setSelectedGroups(transformedGroups);
          }
        } catch (error) {
          toast.error('Failed to fetch segment details');
          console.error('Error fetching segment:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchSegmentData();
  }, [id, initialSegment?._id, allFilters, setValue]);

  const onSubmit = async (data: SegmentFormValues) => {
    if (!selectedGroups.length) {
      toast.error('Please select at least one field to create segment');
      return;
    }

    setIsSaving(true);
    try {
      const transformedGroups = selectedGroups.map((group) => ({
        key: group.key,
        name: group.name || group.key,
        values: Array.isArray(group.values) ? group.values : [group.values],
        fieldId: group.fieldId,
        conditions: group.conditions || [],
        operator: group.operator || 'AND',
      }));

      const params = {
        name: data.segmentName,
        filters: transformedGroups,
      };

      if (isEditMode && segment?._id) {
        const res = await updateSegment(segment._id, params);
        if (res?.status === 200) {
          toast.success('Segment updated successfully');
          navigate(paths.dashboard.audience?.segments || '/dashboard/audience/segments');
        }
      } else {
        const res = await createSegment(params);
        if (res?.status === 200 || res?.status === 201) {
          toast.success('Segment created successfully');
          navigate(paths.dashboard.audience?.segments || '/dashboard/audience/segments');
        }
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save segment');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = () => {
    navigate(paths.dashboard.audience?.segments || '/dashboard/audience/segments');
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href={paths.dashboard.root}>Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={paths.dashboard.audience?.root || '#'}>
                  Audience
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href={paths.dashboard.audience?.segments || '#'}>
                  Segments
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isEditMode ? 'Edit' : 'Create'} Segment</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditMode ? 'Edit' : 'Create'} Segment
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode
                ? 'Update your segment configuration'
                : 'Create a new segment to organize your audience'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Segment Information</CardTitle>
            <CardDescription>Enter a name for your segment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segmentName">
                Segment Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="segmentName"
                {...register('segmentName')}
                placeholder="e.g., Active Users, Premium Customers"
                className={errors.segmentName ? 'border-destructive' : ''}
              />
              {errors.segmentName && (
                <p className="text-sm text-destructive">{errors.segmentName.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Filters</CardTitle>
            <CardDescription>
              Select fields and configure filters to define your segment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentFilterBuilder
              allFilters={allFilters || []}
              selectedFields={selectedFields}
              setSelectedFields={setSelectedFields}
              selectedGroups={selectedGroups}
              setSelectedGroups={setSelectedGroups}
              totalCount={totalCount}
              setTotalCount={setTotalCount}
            />
          </CardContent>
        </Card>

        {selectedGroups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Filters</CardTitle>
              <CardDescription>
                Review and manage your selected filters. Total matching contacts: {totalCount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SelectedFiltersList
                selectedGroups={selectedGroups}
                setSelectedGroups={setSelectedGroups}
                setTotalCount={setTotalCount}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={handleBackClick}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || selectedGroups.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : isEditMode ? 'Update Segment' : 'Create Segment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
