import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { paths } from '@/routes/paths';
import { Plus, RefreshCw, Lock, Copy, CheckCircle2 } from 'lucide-react';
import { getAllAccessTokens, createAccessToken, deleteAccessToken } from '@/actions/webhooks';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CONFIG } from '@/config/config';

// ----------------------------------------------------------------------

export default function WebhooksPage() {
  const { allAccessTokens, isLoading, mutate } = getAllAccessTokens();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [apiKeyName, setApiKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setGeneratedKey(null);
    setApiKeyName('');
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setGeneratedKey(null);
    setApiKeyName('');
  };

  const handleRefresh = async () => {
    await mutate();
  };

  const handleGenerateKey = async () => {
    if (apiKeyName.trim() === '') {
      toast.error('Please enter a name for the API key.');
      return;
    }
    setIsCreating(true);
    try {
      const result = await createAccessToken({
        title: apiKeyName,
      });
      if (result?.data) {
        setGeneratedKey(result.data);
        setApiKeyName('');
        await mutate();
      }
    } catch (error) {
      console.error('Error generating key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyToClipboard = () => {
    const apiUrl = CONFIG.serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const curlCommand = `curl --location '${apiUrl}/webhooks/company-contacts' \\
--header 'Content-Type: application/json' \\
--header 'Authorization: <YOUR_API_KEY>' \\
--data '{
    "users": [
        {
            "firstName": "Saad",
            "lastName": "UR Rehman",
            "preferredName": "Saadi",
            "userType": "custom"
        }
    ]
}'`;
    navigator.clipboard.writeText(curlCommand);
    toast.success('CURL command copied to clipboard!');
  };

  const handleCopyUrl = () => {
    const apiUrl = CONFIG.serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const webhookUrl = `${apiUrl}/webhooks/company-contacts`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    toast.success('Webhook URL copied to clipboard!');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleOpenConfirmDialog = (id: string) => {
    setSelectedKeyId(id);
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedKeyId(null);
  };

  const handleDeleteKey = async () => {
    if (selectedKeyId) {
      try {
        const result = await deleteAccessToken(selectedKeyId);
        if (result) {
          await mutate();
        }
      } catch (error) {
        console.error('Error deleting key:', error);
      }
    }
    handleCloseConfirmDialog();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'HH:mm');
    } catch {
      return '';
    }
  };

  const apiUrl = CONFIG.serverUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const webhookUrl = `${apiUrl}/webhooks/company-contacts`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground mt-1">Configure webhooks for integrations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={handleDialogOpen}>
            <Plus className="h-4 w-4 mr-2" />
            Generate New API Key
          </Button>
        </div>
      </div>

      {/* Webhook Endpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Endpoints</CardTitle>
          <CardDescription>
            Set up webhooks to receive real-time notifications about events in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Type</TableHead>
                  <TableHead className="text-center">URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-center">
                    <span className="font-medium">POST</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded">{webhookUrl}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCopyUrl}
                      >
                        {copiedUrl ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" onClick={handleCopyToClipboard}>
                      <Lock className="h-4 w-4 mr-2" />
                      Copy CURL
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Note: To import company users, use the above CURL with the generated API key as a
            bearer token inside Authorization.
          </p>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      {allAccessTokens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for webhook authentication. Revoke keys that are no longer needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center">Name</TableHead>
                    <TableHead className="text-center">Created At</TableHead>
                    <TableHead className="text-center">Last Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allAccessTokens.map((key: any) => (
                    <TableRow key={key._id || key.id}>
                      <TableCell className="text-center font-medium">{key?.title}</TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{formatDate(key?.createdAt)}</div>
                          <div className="text-muted-foreground">{formatTime(key?.createdAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">
                          <div>{formatDate(key?.updatedAt)}</div>
                          <div className="text-muted-foreground">{formatTime(key?.updatedAt)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenConfirmDialog(key._id || key.id)}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && allAccessTokens.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No API key is currently available. Please click the 'Generate' button to create a new
              one.
            </p>
            <Button onClick={handleDialogOpen}>
              <Plus className="h-4 w-4 mr-2" />
              Generate new API key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generate API Key Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Create a new API key for webhook authentication. Give it a descriptive name to help
              you identify it later.
            </DialogDescription>
          </DialogHeader>
          {generatedKey ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="font-semibold text-green-900">API Key Generated Successfully!</p>
                </div>
                <p className="text-sm text-green-800 mb-3">
                  Please copy this key now. You won't be able to see it again.
                </p>
                <div className="bg-white rounded border p-3 mb-3">
                  <code className="text-sm break-all">{generatedKey}</code>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedKey);
                    toast.success('API key copied to clipboard!');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy API Key
                </Button>
              </div>
              <DialogFooter>
                <Button onClick={handleDialogClose}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">API Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production Webhook Key"
                    value={apiKeyName}
                    onChange={(e) => setApiKeyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && apiKeyName.trim()) {
                        handleGenerateKey();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a descriptive name to help you identify this key later.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateKey} disabled={isCreating || !apiKeyName.trim()}>
                  {isCreating ? 'Generating...' : 'Generate Key'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently revoke the API key and any
              webhooks using it will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseConfirmDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
