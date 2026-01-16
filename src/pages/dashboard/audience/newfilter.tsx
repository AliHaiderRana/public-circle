import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { paths } from '@/routes/paths';
import { getFilterKeys, createFilter, updateFilter } from '@/actions/filters';
import { toast } from 'sonner';

export default function NewFilterPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const { filterKeysData } = getFilterKeys();
  const [selectedKey, setSelectedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateFilter(id!, { filterKey: selectedKey });
        toast.success('Filter updated successfully');
      } else {
        await createFilter({ filterKey: selectedKey });
        toast.success('Filter created successfully');
      }
      navigate(paths.dashboard.audience.filters);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save filter');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(paths.dashboard.audience.filters)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Fields
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit Field' : 'Create New Field'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="filterKey">Field Key</Label>
              <Input
                id="filterKey"
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                placeholder="Enter field key"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEdit ? 'Update Field' : 'Create Field'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(paths.dashboard.audience.filters)}
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
