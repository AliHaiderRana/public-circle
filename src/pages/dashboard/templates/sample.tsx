import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw, Eye, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllSampleTemplates } from '@/actions/templates';
import { mutate } from 'swr';
import { endpoints } from '@/lib/api';
import { paths } from '@/routes/paths';

export default function SampleTemplatesPage() {
  const navigate = useNavigate();
  const { allSampleTemplates, isLoading } = getAllSampleTemplates();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    mutate(endpoints.templates.allSampleTemplates).finally(() => setIsRefreshing(false));
  };

  const handleUseTemplate = (templateId: string) => {
    navigate(`${paths.dashboard.template.create}/${templateId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sample Templates</h1>
          <p className="text-muted-foreground mt-1">
            Browse and use pre-designed email templates
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : !Array.isArray(allSampleTemplates) || allSampleTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No sample templates found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(Array.isArray(allSampleTemplates) ? allSampleTemplates : []).map((template: any) => (
            <Card key={template._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription>{template.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUseTemplate(template._id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
