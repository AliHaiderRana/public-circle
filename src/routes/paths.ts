// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
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
    addfilters: `${ROOTS.DASHBOARD}/addfilters`,
    template: {
      root: `${ROOTS.DASHBOARD}/templates`,
      create: `${ROOTS.DASHBOARD}/templates/template`,
      sample: `${ROOTS.DASHBOARD}/templates/sample`,
      select: `${ROOTS.DASHBOARD}/templates/select`,
    },
    logs: {
      root: `${ROOTS.DASHBOARD}/logs/list`,
      detail: `${ROOTS.DASHBOARD}/logs/details`,
      messages: `${ROOTS.DASHBOARD}/logs/messages`,
    },
    general: {
      app: `${ROOTS.DASHBOARD}/app`,
      ecommerce: `${ROOTS.DASHBOARD}/ecommerce`,
      analytics: `${ROOTS.DASHBOARD}/analytics`,
      banking: `${ROOTS.DASHBOARD}/banking`,
      booking: `${ROOTS.DASHBOARD}/booking`,
      file: `${ROOTS.DASHBOARD}/file`,
      course: `${ROOTS.DASHBOARD}/course`,
      subscription: `${ROOTS.DASHBOARD}/subscription`,
      settings: `${ROOTS.DASHBOARD}/settings`,
      profile: `${ROOTS.DASHBOARD}/profile`,
      organizationSettings: `${ROOTS.DASHBOARD}/organizationSettings`,
    },
    audience: {
      root: `${ROOTS.DASHBOARD}/audience`,
      newsegment: `${ROOTS.DASHBOARD}/audience/newsegment`,
      list: `${ROOTS.DASHBOARD}/audience/list`,
      filters: `${ROOTS.DASHBOARD}/audience/filters`,
      newfilter: `${ROOTS.DASHBOARD}/audience/newfilter`,
      segments: `${ROOTS.DASHBOARD}/audience/segments`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/audience/${id}/edit`,
    },
    campaign: {
      root: `${ROOTS.DASHBOARD}/campaign`,
      list: `${ROOTS.DASHBOARD}/campaign/list`,
      new: `${ROOTS.DASHBOARD}/campaign/new`,
      details: (id: string) => `${ROOTS.DASHBOARD}/campaign/${id}`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/campaign/edit/${id}`,
    },
    configurations: {
      root: `${ROOTS.DASHBOARD}/configurations`,
      webhooks: `${ROOTS.DASHBOARD}/configurations/webhooks`,
      addEmail: `${ROOTS.DASHBOARD}/configurations/newEmail`,
      contacts: `${ROOTS.DASHBOARD}/configurations/contacts`,
      edit: `${ROOTS.DASHBOARD}/configurations/edit`,
      emailconfiguration: `${ROOTS.DASHBOARD}/configurations/emailConfiguration`,
      details: (title: string) => `${ROOTS.DASHBOARD}/configurations/${title}`,
      roles: `${ROOTS.DASHBOARD}/configurations/roles&members`,
    },
  },
};
