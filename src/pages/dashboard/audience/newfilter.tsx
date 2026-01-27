import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowLeft, Loader2, Check, ChevronsUpDown, Search } from 'lucide-react';
import { paths } from '@/routes/paths';
import {
  getFilterKeys,
  createFilter,
  updateFilter,
  getFilterDataTypes,
  getFilterById,
  getFilterValuesWithPagination,
} from '@/actions/filters';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LoadingState } from '@/components/ui/loading-state';

// Filter type options
const FILTER_TYPE_OPTIONS = [
  { name: 'Input', value: 'INPUT' },
  { name: 'Radio Buttons', value: 'RADIO' },
  { name: 'DropDown', value: 'DROP_DOWN' },
  { name: 'Check Boxes', value: 'CHECK_BOX' },
];

// Form schema
const filterSchema = z
  .object({
    filterLabel: z.string().min(1, 'Label is required'),
    filterType: z.string().min(1, 'Field type is required'),
    filterKey: z.string().optional(),
    filterDataType: z.string().optional(),
    filterValues: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const { filterType, filterKey, filterValues } = data;

    // Skip filter values validation if filterType is INPUT
    if (filterType !== 'INPUT') {
      if (filterKey && (!filterValues || filterValues.length === 0)) {
        ctx.addIssue({
          path: ['filterValues'],
          code: z.ZodIssueCode.custom,
          message: 'Must have at least 1 value!',
        });
      }
    }

    if (
      (filterType === 'RADIO' ||
        filterType === 'DROP_DOWN' ||
        filterType === 'CHECK_BOX') &&
      !filterKey
    ) {
      ctx.addIssue({
        path: ['filterKey'],
        code: z.ZodIssueCode.custom,
        message: 'Data key is required',
      });
    }
  });

type FilterFormData = z.infer<typeof filterSchema>;

export default function NewFilterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // API data
  const { filterKeysData } = getFilterKeys();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [filterDataTypes, setFilterDataTypes] = useState<string[]>([]);
  const [filterDataTypeLoading, setFilterDataTypeLoading] = useState(false);
  const [valuesData, setValuesData] = useState<string[]>([]);
  const [totalValues, setTotalValues] = useState(0);
  const [valuesPage, setValuesPage] = useState(1);
  const [hasMoreValues, setHasMoreValues] = useState(true);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [isSelectAllVisible, setIsSelectAllVisible] = useState(false);
  const [keyPopoverOpen, setKeyPopoverOpen] = useState(false);
  const [dataTypePopoverOpen, setDataTypePopoverOpen] = useState(false);
  const [keySearchTerm, setKeySearchTerm] = useState('');
  const [dataTypeSearchTerm, setDataTypeSearchTerm] = useState('');
  const [errorDialogData, setErrorDialogData] = useState<{
    message?: string;
    segments?: { id: string; name: string }[];
  } | null>(null);

  const PAGE_SIZE = 50;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      filterLabel: '',
      filterType: '',
      filterKey: '',
      filterDataType: '',
      filterValues: [],
    },
  });

  const formValues = watch();

  // Fetch filter values with pagination
  const fetchFilterValues = async (key: string, page: number = 1, search: string = '') => {
    setValuesLoading(true);
    try {
      const response = await getFilterValuesWithPagination(
        key,
        page,
        PAGE_SIZE,
        id,
        search
      );
      if (response?.status === 200) {
        const newValues = response.data?.data?.contactValues || [];
        setTotalValues(response.data?.data?.totalResults || 0);
        setHasMoreValues(newValues.length === PAGE_SIZE);

        if (page === 1) {
          setValuesData(newValues);
        } else {
          setValuesData((prev) => [...prev, ...newValues]);
        }

        return newValues;
      }
    } catch (error) {
      console.error('Error fetching filter values:', error);
    } finally {
      setValuesLoading(false);
    }
    return [];
  };

  // Fetch filter data for edit mode
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!id) return;

      setIsPageLoading(true);
      try {
        const response = await getFilterById(id);
        if (response?.status === 200) {
          const filterData = response.data?.data;
          setValue('filterLabel', filterData.filterLabel || '');
          setValue('filterType', filterData.filterType || '');
          setValue('filterKey', filterData.filterKey || '');
          setValue('filterDataType', filterData.filterDataType || '');
          setValue('filterValues', filterData.filterValues || []);

          // Fetch data types for the filter key
          if (filterData.filterKey) {
            setFilterDataTypeLoading(true);
            const dtResponse = await getFilterDataTypes({
              filterKey: filterData.filterKey,
            });
            if (dtResponse?.data?.data) {
              setFilterDataTypes(dtResponse.data.data);
            }
            setFilterDataTypeLoading(false);

            // Fetch filter values
            await fetchFilterValues(filterData.filterKey, 1);
          }
        }
      } catch (error) {
        console.error('Error fetching filter:', error);
        toast.error('Failed to load filter data');
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchFilterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Handle filter key change
  const handleFilterKeyChange = async (newKey: string) => {
    setValue('filterKey', newKey);
    setValue('filterValues', []);
    setValue('filterDataType', '');
    setValuesData([]);
    setValuesPage(1);
    setHasMoreValues(true);
    setIsSelectAll(false);
    setIsSelectAllVisible(false);
    setSearchTerm('');
    setKeyPopoverOpen(false);

    if (newKey) {
      // Fetch data types
      setFilterDataTypeLoading(true);
      try {
        const response = await getFilterDataTypes({ filterKey: newKey });
        if (response?.data?.data) {
          setFilterDataTypes(response.data.data);
          if (response.data.data.length > 0) {
            setValue('filterDataType', response.data.data[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching data types:', error);
      } finally {
        setFilterDataTypeLoading(false);
      }

      // Fetch filter values
      await fetchFilterValues(newKey, 1);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    if (!formValues.filterKey) return;

    const filterKey = formValues.filterKey;
    const timer = setTimeout(() => {
      setValuesPage(1);
      fetchFilterValues(filterKey, 1, searchTerm);
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle load more
  const handleLoadMore = async () => {
    setLoadMoreLoading(true);
    try {
      const nextPage = valuesPage + 1;
      setValuesPage(nextPage);
      await fetchFilterValues(formValues.filterKey || '', nextPage, searchTerm);
    } finally {
      setLoadMoreLoading(false);
    }
  };

  // Handle select all (all values in database)
  const handleSelectAll = (checked: boolean) => {
    setIsSelectAll(checked);
    setIsSelectAllVisible(false);
    if (checked) {
      setValue('filterValues', [...valuesData]);
    } else {
      setValue('filterValues', []);
    }
  };

  // Handle select all visible (only loaded values)
  const handleSelectAllVisible = (checked: boolean) => {
    setIsSelectAllVisible(checked);
    setIsSelectAll(false);
    if (checked) {
      setValue('filterValues', [...valuesData]);
    } else {
      setValue('filterValues', []);
    }
  };

  // Handle individual value selection
  const handleValueToggle = (value: string) => {
    const currentValues = formValues.filterValues || [];
    if (currentValues.includes(value)) {
      setValue(
        'filterValues',
        currentValues.filter((v) => v !== value)
      );
      setIsSelectAll(false);
      setIsSelectAllVisible(false);
    } else {
      setValue('filterValues', [...currentValues, value]);
    }
  };

  // Form submission
  const onSubmit = async (data: FilterFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        filterValues: isSelectAll ? [] : data.filterValues,
      };

      if (isEdit) {
        const res = await updateFilter(id!, payload);
        if (res?.status === 200) {
          toast.success('Field updated successfully');
          navigate(paths.dashboard.audience.filters);
        }
      } else {
        const res = await createFilter(payload);
        if (res?.status === 200 || res?.status === 201) {
          toast.success('Field created successfully');
          navigate(paths.dashboard.audience.filters);
        }
      }
    } catch (error: any) {
      if (error?.response?.data?.segments) {
        setErrorDialogData(error.response.data);
      } else {
        toast.error(
          error?.response?.data?.message || 'Failed to save field'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show values section only for non-INPUT types with a key selected
  const showValuesSection =
    formValues.filterType !== 'INPUT' && formValues.filterKey;

  const handleBackClick = () => {
    navigate(paths.dashboard.audience.filters);
  };

  if (isPageLoading) {
    return <LoadingState variant="spinner" message="Loading field data..." />;
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
                <BreadcrumbLink href={paths.dashboard.audience?.filters || '#'}>
                  Fields
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{isEdit ? 'Edit' : 'Create'} Field</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="mt-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {isEdit ? 'Edit' : 'Create'} Field
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEdit
                ? 'Update your field configuration'
                : 'Create a new field to organize your audience data'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleBackClick}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Field Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Label */}
            <div className="space-y-2">
              <Label htmlFor="filterLabel">Label</Label>
              <Input
                id="filterLabel"
                {...register('filterLabel')}
                placeholder="Enter field label"
              />
              {errors.filterLabel && (
                <p className="text-sm text-destructive">
                  {errors.filterLabel.message}
                </p>
              )}
            </div>

            {/* Filter Type */}
            <div className="space-y-2">
              <Label>Input Type</Label>
              <Select
                value={formValues.filterType}
                onValueChange={(value) => {
                  setValue('filterType', value);
                  setValue('filterKey', '');
                  setValue('filterDataType', '');
                  setValue('filterValues', []);
                  setValuesData([]);
                  setIsSelectAll(false);
                  setSearchTerm('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select input type" />
                </SelectTrigger>
                <SelectContent>
                  {FILTER_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.filterType && (
                <p className="text-sm text-destructive">
                  {errors.filterType.message}
                </p>
              )}
            </div>

            {/* Data Key */}
            <div className="space-y-2">
              <Label>Data Key</Label>
              <Popover open={keyPopoverOpen} onOpenChange={setKeyPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={keyPopoverOpen}
                    className="w-full justify-between"
                  >
                    {formValues.filterKey || 'Select data key...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search keys..."
                      value={keySearchTerm}
                      onChange={(e) => setKeySearchTerm(e.target.value)}
                    />
                    <CommandList>
                      {filterKeysData?.data?.filter((key: string) =>
                        key.toLowerCase().includes(keySearchTerm.toLowerCase())
                      ).length === 0 ? (
                        <CommandEmpty>No keys found.</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {filterKeysData?.data
                            ?.filter((key: string) =>
                              key.toLowerCase().includes(keySearchTerm.toLowerCase())
                            )
                            .map((key: string) => (
                              <CommandItem
                                key={key}
                                value={key}
                                onSelect={() => {
                                  handleFilterKeyChange(key);
                                  setKeySearchTerm('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    formValues.filterKey === key
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  )}
                                />
                                {key}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.filterKey && (
                <p className="text-sm text-destructive">
                  {errors.filterKey.message}
                </p>
              )}
            </div>

            {/* Data Type */}
            {formValues.filterKey && (
              <div className="space-y-2">
                <Label>Data Type</Label>
                {filterDataTypeLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading data types...
                  </div>
                ) : (
                  <Popover
                    open={dataTypePopoverOpen}
                    onOpenChange={setDataTypePopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={dataTypePopoverOpen}
                        className="w-full justify-between"
                      >
                        {formValues.filterDataType || 'Select data type...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search data types..."
                          value={dataTypeSearchTerm}
                          onChange={(e) => setDataTypeSearchTerm(e.target.value)}
                        />
                        <CommandList>
                          {filterDataTypes.filter((dt) =>
                            dt.toLowerCase().includes(dataTypeSearchTerm.toLowerCase())
                          ).length === 0 ? (
                            <CommandEmpty>No data types found.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filterDataTypes
                                .filter((dt) =>
                                  dt.toLowerCase().includes(dataTypeSearchTerm.toLowerCase())
                                )
                                .map((dt) => (
                                  <CommandItem
                                    key={dt}
                                    value={dt}
                                    onSelect={() => {
                                      setValue('filterDataType', dt);
                                      setDataTypePopoverOpen(false);
                                      setDataTypeSearchTerm('');
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        'mr-2 h-4 w-4',
                                        formValues.filterDataType === dt
                                          ? 'opacity-100'
                                          : 'opacity-0'
                                      )}
                                    />
                                    {dt}
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                {errors.filterDataType && (
                  <p className="text-sm text-destructive">
                    {errors.filterDataType.message}
                  </p>
                )}
              </div>
            )}

            {/* Filter Values */}
            {showValuesSection && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Label>
                    Values{' '}
                    {!isSelectAll && formValues.filterValues?.length
                      ? `(${formValues.filterValues.length})`
                      : ''}
                  </Label>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="selectAllVisible"
                        checked={isSelectAllVisible}
                        onCheckedChange={handleSelectAllVisible}
                      />
                      <Label htmlFor="selectAllVisible" className="text-sm font-normal">
                        Select All Visible
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="selectAll"
                        checked={isSelectAll}
                        onCheckedChange={handleSelectAll}
                      />
                      <Label htmlFor="selectAll" className="text-sm font-normal">
                        Select All
                      </Label>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search values..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                  </div>
                </div>

                {isSelectAll ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    (All values of your audience are selected)
                  </div>
                ) : valuesLoading && valuesData.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : valuesData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No values found
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto p-2 border rounded-md">
                      {valuesData.map((value, index) => (
                        <div
                          key={`${value}-${index}`}
                          className="flex items-center gap-2 p-2 hover:bg-muted rounded-md"
                        >
                          <Checkbox
                            id={`value-${index}`}
                            checked={formValues.filterValues?.includes(value)}
                            onCheckedChange={() => handleValueToggle(value)}
                          />
                          <Label
                            htmlFor={`value-${index}`}
                            className="text-sm font-normal truncate cursor-pointer"
                          >
                            {value}
                          </Label>
                        </div>
                      ))}
                    </div>

                    {hasMoreValues && valuesData.length < totalValues && (
                      <div className="flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleLoadMore}
                          disabled={loadMoreLoading}
                        >
                          {loadMoreLoading && (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          )}
                          Load More
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {errors.filterValues && (
                  <p className="text-sm text-destructive">
                    {errors.filterValues.message}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackClick}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoading
                  ? 'Saving...'
                  : isEdit
                    ? 'Update Field'
                    : 'Create Field'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Dialog - When field is used in segments */}
      <Dialog open={!!errorDialogData} onOpenChange={() => setErrorDialogData(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Unable to {isEdit ? 'Update' : 'Delete'} Field</DialogTitle>
            <DialogDescription>{errorDialogData?.message}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm font-medium">
              This field is used in the following segments:
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {errorDialogData?.segments?.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <span className="font-medium">{segment.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate(
                        `${paths.dashboard.audience.newsegment}/${segment.id}`
                      );
                      setErrorDialogData(null);
                    }}
                  >
                    Go to Segment
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorDialogData(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
