// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
} as const;

// ----------------------------------------------------------------------

/**
 * Path Constants
 * 
 * Centralized path definitions for the application.
 * All routes should use these constants instead of hardcoded strings.
 * 
 * Dynamic paths (with parameters) are provided as functions.
 */

export const paths = {
  // Public routes
  emailVerification: '/email-verification',
  analytics: '/analytics',
  maintenance: '/maintenance',
  pricing: '/pricing',
  payment: '/payment',
  about: '/about-us',
  contact: '/contact-us',
  faqs: '/faqs',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  components: '/components',

  // AUTH
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
      resetPassword: `${ROOTS.AUTH}/jwt/reset-password`,
      updatePassword: `${ROOTS.AUTH}/jwt/update-password`,
    },
  },

  // DASHBOARD
  dashboard: {
    root: `${ROOTS.DASHBOARD}`,
    analytics: `${ROOTS.DASHBOARD}/analytics`,
    
    // Campaign routes
    campaign: {
      root: `${ROOTS.DASHBOARD}/campaign`,
      list: `${ROOTS.DASHBOARD}/campaign/list`,
      new: `${ROOTS.DASHBOARD}/campaign/new`,
      recurring: `${ROOTS.DASHBOARD}/campaign/recurring`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/campaign/edit/${id}`,
      details: (id: string) => `${ROOTS.DASHBOARD}/campaign/${id}`,
    },

    // Template routes
    template: {
      root: `${ROOTS.DASHBOARD}/templates`,
      create: `${ROOTS.DASHBOARD}/templates/template`,
      createWithId: (id: string) => `${ROOTS.DASHBOARD}/templates/template/${id}`,
      sample: `${ROOTS.DASHBOARD}/templates/sample`,
      select: `${ROOTS.DASHBOARD}/templates/select`,
    },

    // Audience routes
    audience: {
      root: `${ROOTS.DASHBOARD}/audience`,
      filters: `${ROOTS.DASHBOARD}/audience/filters`,
      newFilter: `${ROOTS.DASHBOARD}/audience/newfilter`,
      newFilterWithId: (id: string) => `${ROOTS.DASHBOARD}/audience/newfilter/${id}`,
      segments: `${ROOTS.DASHBOARD}/audience/segments`,
      newSegment: `${ROOTS.DASHBOARD}/audience/newsegment`,
      newSegmentWithId: (id: string) => `${ROOTS.DASHBOARD}/audience/newsegment/${id}`,
      editSegment: (id: string) => `${ROOTS.DASHBOARD}/audience/${id}/edit`,
      list: `${ROOTS.DASHBOARD}/audience/list`,
      // Legacy paths for backward compatibility
      newsegment: `${ROOTS.DASHBOARD}/audience/newsegment`,
      newfilter: `${ROOTS.DASHBOARD}/audience/newfilter`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/audience/${id}/edit`,
    },

    // Contacts routes
    contacts: {
      root: `${ROOTS.DASHBOARD}/contacts`,
      list: `${ROOTS.DASHBOARD}/contacts/list`,
      import: `${ROOTS.DASHBOARD}/contacts/import`,
    },

    // Configuration routes
    configurations: {
      root: `${ROOTS.DASHBOARD}/configurations`,
      contacts: `${ROOTS.DASHBOARD}/configurations/contacts`,
      contactsImport: `${ROOTS.DASHBOARD}/configurations/contacts/import`,
      emailConfiguration: `${ROOTS.DASHBOARD}/configurations/emailConfiguration`,
      newEmail: `${ROOTS.DASHBOARD}/configurations/newEmail`,
      domainEmails: (domain: string) => `${ROOTS.DASHBOARD}/configurations/domain-emails?domain=${domain}`,
      webhooks: `${ROOTS.DASHBOARD}/configurations/webhooks`,
      roles: `${ROOTS.DASHBOARD}/configurations/roles&members`,
      // Legacy paths for backward compatibility
      addEmail: `${ROOTS.DASHBOARD}/configurations/newEmail`,
      emailconfiguration: `${ROOTS.DASHBOARD}/configurations/emailConfiguration`,
      details: (title: string) => `${ROOTS.DASHBOARD}/configurations/${title}`,
    },

    // Logs routes
    logs: {
      root: `${ROOTS.DASHBOARD}/logs/list`,
      list: `${ROOTS.DASHBOARD}/logs/list`,
      detail: `${ROOTS.DASHBOARD}/logs/details`,
      detailWithId: (id: string) => `${ROOTS.DASHBOARD}/logs/details/${id}`,
      messages: `${ROOTS.DASHBOARD}/logs/messages`,
    },

    // Settings routes
    general: {
      settings: `${ROOTS.DASHBOARD}/settings`,
      profile: `${ROOTS.DASHBOARD}/profile`,
      organizationSettings: `${ROOTS.DASHBOARD}/organizationSettings`,
      subscription: `${ROOTS.DASHBOARD}/subscription`,
      // Legacy paths (kept for backward compatibility)
      app: `${ROOTS.DASHBOARD}/app`,
      ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      banking: `${ROOTS.DASHBOARD}/banking`,
      booking: `${ROOTS.DASHBOARD}/booking`,
      file: `${ROOTS.DASHBOARD}/file`,
      course: `${ROOTS.DASHBOARD}/course`,
    },

    // Legacy paths (kept for backward compatibility)
    addfilters: `${ROOTS.DASHBOARD}/addfilters`,
  },
} as const;

// Type exports for better TypeScript support
export type Paths = typeof paths;
export type DashboardPaths = typeof paths.dashboard;
export type AuthPaths = typeof paths.auth;
