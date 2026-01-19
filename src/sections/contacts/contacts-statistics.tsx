import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, AlertTriangle, Users, Ban } from 'lucide-react';
import {
  getInvalidEmailCount,
  getUnSubscribedEmailCount,
  getApplePrivateContactsCount,
} from '@/actions/contacts';

// ----------------------------------------------------------------------

export function ContactsStatistics() {
  const { InvalidEmailCount, DuplicatedCount } = getInvalidEmailCount();
  const { UnSubscribedEmailCount } = getUnSubscribedEmailCount();
  const { ApplePrivateContactsCount } = getApplePrivateContactsCount();

  const stats = [
    {
      title: 'Invalid Emails',
      value: InvalidEmailCount,
      description: 'Contacts with invalid email addresses',
      icon: AlertTriangle,
      variant: 'destructive' as const,
      showDuplicates: DuplicatedCount > 0,
      duplicateCount: DuplicatedCount,
    },
    {
      title: 'Unsubscribed',
      value: UnSubscribedEmailCount,
      description: 'Contacts who have unsubscribed',
      icon: Ban,
      variant: 'secondary' as const,
    },
    {
      title: 'Apple Private Relay',
      value: ApplePrivateContactsCount,
      description: 'Contacts using Apple Private Relay',
      icon: Mail,
      variant: 'default' as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription className="mt-1">
                {stat.description}
                {stat.showDuplicates && (
                  <Badge variant="outline" className="ml-2">
                    {stat.duplicateCount} duplicates
                  </Badge>
                )}
              </CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
