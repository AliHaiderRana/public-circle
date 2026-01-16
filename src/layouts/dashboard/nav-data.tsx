import React from 'react';
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  Settings,
  BarChart3,
  FileClock,
  UserCog,
  Shield,
  CreditCard,
  Bell,
} from 'lucide-react';
import { paths } from '@/routes/paths';

export interface NavItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  roles?: string[];
}

export const navData: { subheader: string; items: NavItem[] }[] = [
  {
    subheader: 'Overview',
    items: [
      {
        title: 'Dashboard',
        path: paths.dashboard.analytics,
        icon: <LayoutDashboard className="h-5 w-5" />,
      },
    ],
  },
  {
    subheader: 'Management',
    items: [
      {
        title: 'Campaigns',
        path: paths.dashboard.campaign.root,
        icon: <Mail className="h-5 w-5" />,
      },
      {
        title: 'Campaign Logs',
        path: paths.dashboard.logs.root,
        icon: <FileClock className="h-5 w-5" />,
      },
      {
        title: 'Templates',
        path: paths.dashboard.template.root,
        icon: <FileText className="h-5 w-5" />,
      },
      {
        title: 'Audience',
        path: paths.dashboard.audience.root,
        icon: <Users className="h-5 w-5" />,
        children: [
          { title: 'Fields', path: paths.dashboard.audience.filters },
          { title: 'Segments', path: paths.dashboard.audience.segments },
          { title: 'Contacts', path: paths.dashboard.audience.list },
        ],
      },
      {
        title: 'Configurations',
        path: paths.dashboard.configurations.root,
        icon: <Settings className="h-5 w-5" />,
        children: [
          {
            title: 'Emails and Domains',
            path: paths.dashboard.configurations.emailconfiguration,
          },
          { title: 'Contacts Import', path: paths.dashboard.configurations.contacts },
          { title: 'Webhooks', path: paths.dashboard.configurations.webhooks },
          {
            title: 'Roles & Members',
            path: paths.dashboard.configurations.roles,
            roles: ['Admin'],
          },
        ],
      },
    ],
  },
];

export const accountMenuItems = [
  {
    label: 'Dashboard',
    href: paths.dashboard.analytics,
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: 'Profile Settings',
    href: paths.dashboard.general.profile,
    icon: <UserCog className="h-4 w-4" />,
  },
  {
    label: 'Organizational Settings',
    href: paths.dashboard.general.organizationSettings,
    icon: <Settings className="h-4 w-4" />,
    roles: ['Admin'],
  },
  {
    label: 'Roles & Members',
    href: paths.dashboard.configurations.roles,
    icon: <Shield className="h-4 w-4" />,
    roles: ['Admin'],
  },
  {
    label: 'Payments',
    href: paths.dashboard.general.subscription,
    icon: <CreditCard className="h-4 w-4" />,
  },
];
