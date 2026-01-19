import React from 'react';
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  Settings,
  FileClock,
  UserCog,
  Shield,
  CreditCard,
  MapPin,
  Plus,
  List,
  Repeat,
  Filter,
  UserPlus,
  Edit,
  Contact,
  Globe,
  Webhook,
  UserCheck,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import { paths } from '@/routes/paths';

export interface NavItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  roles?: string[];
  badge?: string | number;
}

/**
 * Navigation Data Configuration
 * 
 * Hierarchical navigation structure for the dashboard sidebar.
 * Supports nested navigation items with role-based filtering.
 * 
 * Structure:
 * - Subheaders group related navigation items
 * - Items can have children for nested navigation
 * - Role-based access control via roles array
 * - Icons for visual identification
 */
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
    subheader: 'Campaign Management',
    items: [
      {
        title: 'Campaigns',
        path: paths.dashboard.campaign.list,
        icon: <Mail className="h-5 w-5" />,
        children: [
          {
            title: 'All Campaigns',
            path: paths.dashboard.campaign.list,
            icon: <List className="h-4 w-4" />,
          },
          {
            title: 'Create Campaign',
            path: paths.dashboard.campaign.new,
            icon: <Plus className="h-4 w-4" />,
          },
          {
            title: 'Recurring Campaigns',
            path: paths.dashboard.campaign.recurring,
            icon: <Repeat className="h-4 w-4" />,
          },
        ],
      },
      {
        title: 'Campaign Logs',
        path: paths.dashboard.logs.root,
        icon: <FileClock className="h-5 w-5" />,
        children: [
          {
            title: 'Campaign Logs',
            path: paths.dashboard.logs.list,
            icon: <List className="h-4 w-4" />,
          },
          {
            title: 'Message Logs',
            path: paths.dashboard.logs.messages,
            icon: <Mail className="h-4 w-4" />,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Content Management',
    items: [
      {
        title: 'Templates',
        path: paths.dashboard.template.root,
        icon: <FileText className="h-5 w-5" />,
        children: [
          {
            title: 'My Templates',
            path: paths.dashboard.template.root,
            icon: <FolderOpen className="h-4 w-4" />,
          },
          {
            title: 'Create Template',
            path: paths.dashboard.template.create,
            icon: <Plus className="h-4 w-4" />,
          },
          {
            title: 'Sample Templates',
            path: paths.dashboard.template.sample,
            icon: <Sparkles className="h-4 w-4" />,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Audience Management',
    items: [
      {
        title: 'Audience',
        path: paths.dashboard.audience.root,
        icon: <Users className="h-5 w-5" />,
        children: [
          {
            title: 'Fields',
            path: paths.dashboard.audience.filters,
            icon: <Filter className="h-4 w-4" />,
          },
          {
            title: 'Segments',
            path: paths.dashboard.audience.segments,
            icon: <UserCheck className="h-4 w-4" />,
          },
          {
            title: 'Contacts',
            path: paths.dashboard.audience.list,
            icon: <Contact className="h-4 w-4" />,
          },
        ],
      },
    ],
  },
  {
    subheader: 'Configuration',
    items: [
      {
        title: 'Settings',
        path: paths.dashboard.configurations.root,
        icon: <Settings className="h-5 w-5" />,
        children: [
          {
            title: 'Emails and Domains',
            path: paths.dashboard.configurations.emailConfiguration,
            icon: <Globe className="h-4 w-4" />,
          },
          {
            title: 'Contacts Import',
            path: paths.dashboard.configurations.contacts,
            icon: <UserPlus className="h-4 w-4" />,
          },
          {
            title: 'Webhooks',
            path: paths.dashboard.configurations.webhooks,
            icon: <Webhook className="h-4 w-4" />,
          },
          {
            title: 'Roles & Members',
            path: paths.dashboard.configurations.roles,
            icon: <Shield className="h-4 w-4" />,
            roles: ['Admin'],
          },
        ],
      },
    ],
  },
];

export interface AccountMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles?: string[];
  isTour?: boolean;
}

/**
 * Account Menu Items
 * 
 * Navigation items for the user account dropdown menu.
 * Includes profile settings, organization settings, and utility links.
 */
export const accountMenuItems: AccountMenuItem[] = [
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
  {
    label: 'Take a Tour',
    href: '#',
    icon: <MapPin className="h-4 w-4" />,
    isTour: true,
  },
];
