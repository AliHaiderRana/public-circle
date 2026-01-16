import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { paths } from '@/routes/paths';
import { createSegment, updateSegment, getSegmentById } from '@/actions/segments';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewSegmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (isEdit && id) {
      const loadSegment = async () => {
        try {
          const res = await getSegmentById(id);
          if (res?.data?.data) {
            setValue('name', res.data.data.name);
            setValue('description', res.data.data.description || '');
          }
        } catch (error) {
          toast.error('Failed to load segment');
        }
      };
      loadSegment();
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      if (isEdit && id) {
        await updateSegment(id, data);
        toast.success('Segment updated successfully');
      } else {
        await createSegment(data);
        toast.success('Segment created successfully');
      }
      navigate(paths.dashboard.audience.segments);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save segment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(paths.dashboard.audience.segments)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Segments
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Segment' : 'Create New Segment'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Segment Name</Label>
              <Input id="name" {...register('name')} placeholder="Enter segment name" required />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter segment description"
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update Segment' : 'Create Segment'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(paths.dashboard.audience.segments)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
