import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { paths } from '@/routes/paths';
import { getCampaignLogById } from '@/actions/logs';
import { useParams } from 'react-router-dom';

export default function CampaignLogDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [log, setLog] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchLog = async () => {
        try {
          const res = await getCampaignLogById(id);
          if (res?.data?.data) {
            setLog(res.data.data);
          }
        } catch (error) {
          console.error('Error fetching log:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLog();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(paths.dashboard.logs.root)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Logs
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Log Details</CardTitle>
          <CardDescription>Detailed information about campaign execution</CardDescription>
        </CardHeader>
        <CardContent>
          {log ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Campaign Name</p>
                <p className="text-lg">{log.campaignName || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-lg">{log.status || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sent</p>
                <p className="text-lg">{log.sentCount || 0}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed</p>
                <p className="text-lg">{log.failedCount || 0}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Log not found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
