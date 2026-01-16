// ----------------------------------------------------------------------

export const CONFIG = {
  appName: 'Public circle',
  appVersion: '1.0.0',
  serverUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  assetsDir: import.meta.env.VITE_ASSETS_DIR ?? '',
  /**
   * Auth
   * @method jwt | amplify | firebase | supabase | auth0
   */
  auth: {
    method: 'jwt',
    skip: false,
    redirectPath: '/dashboard',
  },
};

// ----------------------------------------------------------------------

export const STORAGE_KEY = 'jwt_access_token';
export const REGION_KEY = 'REGION_KEY';
export const SELECTED_PLAN = 'selected_plan';
export const SELECTED_ADD_ONS = 'selected_add_ons';

// Signup constants
export const SIGNUP_STEPS = {
  EMAIL: 1,
  EMAIL_VERIFICATION: 2,
  PASSWORD: 3,
  COMPANY_INFO: 4,
  ADDITIONAL_INFO: 5,
  REFERRAL: 6,
  PLAN_SELECTION: 7,
  PAYMENT: 8,
} as const;

// ----------------------------------------------------------------------

export const endpoints = {
  campaigns: {
    allCampaigns: '/campaigns/all',
    campaigns: '/campaigns',
  },
  dashboard: {
    dashboardStats: '/users/get-dashboard-data',
  },
  logs: {
    logs: '/campaigns/logs',
  },
  filters: {
    filterTypes: '/company-contacts/possible-filter-keys/',
    filters: '/filters',
    filterValues: '/company-contacts/contact-values',
    filterCount: '/company-contacts/get-filter-count',
  },
  segments: {
    allSegments: '/segments/all',
    segments: '/segments',
  },
  configurations: {
    checkVerificationStatus: '/configuration/email/check-verification-status',
    verifiedEmails: '/configuration/email/verified-addresses',
    configuration: '/configuration',
    emailCreation: '/configuration/email/address',
    domainCreation: '/configuration/email/domain',
    addDomainEmail: '/configuration/email/domain/email-address',
    deleteEmail: '/configuration/email/address/',
    deleteDomain: '/configuration/email/domain/',
  },
  templates: {
    allTemplates: '/templates/all?kind=REGULAR',
    allSampleTemplates: '/templates/all?kind=SAMPLE',
    allCategories: '/template-categories/all',
    templates: '/templates',
  },
  user: {
    getAllUsers: '/company-contacts/all?pageNumber=1&pageSize=10',
    uploadCSV: '/company-contacts/upload-csv',
  },
  auth: {
    me: '/users/me',
    signIn: '/auth/login',
    signUp: '/auth/register',
    token: '/auth/token',
    forgotPassword: '/auth/forgot-password',
  },
  notifications: {
    list: '/notifications',
  },
  subscription: {
    status: '/stripe/active-subscription',
    active: '/stripe/active-subscription',
  },
  invoices: {
    overageQuota: '/invoices/overage-quota',
  },
};
