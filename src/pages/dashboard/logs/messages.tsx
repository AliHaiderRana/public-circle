import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RefreshCw } from 'lucide-react';
import { getMessageLogs } from '@/actions/logs';
import { toast } from 'sonner';

export default function MessageLogsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchMessages = async () => {
    setIsRefreshing(true);
    try {
      const res = await getMessageLogs();
      if (res?.data?.data) {
        setMessages(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching message logs:', error);
      toast.error('Failed to fetch message logs');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Message Logs</h1>
          <p className="text-muted-foreground mt-1">View individual message delivery logs</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchMessages} disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No message logs found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message: any) => (
                  <TableRow key={message._id}>
                    <TableCell>{message.recipient}</TableCell>
                    <TableCell>{message.subject || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          message.status === 'delivered'
                            ? 'bg-green-100 text-green-800'
                            : message.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {message.status || 'pending'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(message.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
