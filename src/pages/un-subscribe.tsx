import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import axios from '@/lib/api';

export default function UnSubscribePage() {
  const [searchParams] = useSearchParams();
  const companyId = searchParams.get('ccid');
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const verifyEmailAsync = async () => {
      setIsVerifyingEmail(true);
      try {
        const res = await axios.post('company-contacts/un-subscribe/', {
          companyContactId: companyId,
        });
        if (res?.status === 200) {
          setMessage(res?.data?.message || 'Successfully unsubscribed');
          setMessageType('success');
        } else {
          setMessage(res?.data?.message || 'Failed to unsubscribe');
          setMessageType('error');
        }
      } catch (error: any) {
        setMessage(
          error?.response?.data?.message || error?.message || 'Something went wrong.'
        );
        setMessageType('error');
      } finally {
        setIsVerifyingEmail(false);
      }
    };

    if (companyId) {
      verifyEmailAsync();
    } else {
      setMessage('Missing contact ID. Unable to unsubscribe.');
      setMessageType('error');
      setIsVerifyingEmail(false);
    }
  }, [companyId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <Card className="max-w-3xl w-full shadow-lg rounded-lg">
        <CardContent className="p-12 text-center">
          {isVerifyingEmail ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Processing unsubscribe request...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                {messageType === 'success' ? (
                  <CheckCircle2 className="h-24 w-24 text-green-500" />
                ) : (
                  <XCircle className="h-24 w-24 text-red-500" />
                )}
              </div>

              <h1 className="text-3xl font-bold mb-4">
                {messageType === 'success'
                  ? 'Successfully Unsubscribed'
                  : 'Oops! Something went wrong'}
              </h1>

              {messageType === 'success' && (
                <p className="text-xl text-gray-600 mt-6">
                  You will no longer receive email notifications from us.
                </p>
              )}

              {message && (
                <p className="text-gray-500 mt-4">{message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
