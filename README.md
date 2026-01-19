# Public Circle - Email Marketing Platform

A comprehensive email marketing and campaign management platform built with React, TypeScript, and shadcn/ui.

## 🚀 Features

### Core Functionality
- **Campaign Management**: Create, edit, and manage email campaigns
- **Template Management**: Visual template editor with drag-and-drop
- **Audience Management**: Contact management, segmentation, and filtering
- **Analytics Dashboard**: Real-time campaign performance metrics
- **Configuration Management**: Email settings, webhooks, roles & members

### Advanced Features
- **Notifications System**: Toast notifications and notification center
- **Subscription Management**: Full subscription lifecycle management
- **SES Status Monitoring**: Real-time email service health monitoring
- **Auto-refresh**: Automatic data polling and cache revalidation
- **Accessibility**: Full keyboard navigation and screen reader support

## 🛠️ Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **SWR** - Data fetching and caching
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **Zod** - Schema validation
- **React Hook Form** - Form management
- **Sonner** - Toast notifications

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
public-circle/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   └── custom/         # Custom components
│   ├── pages/              # Page components
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # Dashboard pages
│   │   └── ...             # Other pages
│   ├── layouts/            # Layout components
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── actions/            # API actions
│   ├── routes/             # Route definitions
│   └── auth/               # Authentication logic
├── public/                 # Static assets
└── package.json           # Dependencies
```

## 🎨 Key Components

### Navigation
- `CustomBreadcrumbs` - Consistent breadcrumb navigation
- `DashboardLayout` - Main dashboard layout with sidebar
- `DashboardHeader` - Header with notifications and user menu

### UI Components
- `LoadingState` - Multiple loading state variants
- `ErrorState` - Error handling UI
- `EmptyState` - Empty state variants
- `AutoRefreshIndicator` - Auto-refresh status indicator

### Features
- `NotificationsCenter` - Full-featured notification drawer
- `SubscriptionStatusAlert` - Subscription status alerts
- `SesStatusBadge` - SES status monitoring

### Hooks
- `useKeyboardNavigation` - Keyboard navigation support
- `useFocusManagement` - Focus trapping and management
- `useAutoRefresh` - Polling and auto-refresh

## 🔐 Authentication

The application uses JWT-based authentication with:
- Sign in/Sign up pages
- Password reset/update
- Session management
- Role-based access control
- Auth guards (AuthGuard, GuestGuard, RoleBasedGuard)

## 📱 Responsive Design

The application is fully responsive with:
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Mobile navigation drawer
- Responsive tables and cards
- Touch-friendly interactions

## ♿ Accessibility

Full accessibility support including:
- ARIA attributes throughout
- Keyboard navigation
- Focus management
- Screen reader support
- Reduced motion preferences
- Semantic HTML

## 🚦 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd public-circle
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:5173
   ```

## 📝 Environment Variables

Create a `.env` file based on `env.example`:

```env
VITE_API_URL=http://localhost:3001
VITE_ASSETS_DIR=
```

## 🧪 Development

### Code Style
- TypeScript strict mode
- ESLint for linting
- Prettier for formatting (if configured)

### Component Development
- Use shadcn/ui components as base
- Follow accessibility guidelines
- Implement loading and error states
- Add keyboard navigation support

## 📚 Documentation

- [Migration Plan](../WEB_MIGRATION_PLAN.md) - Complete migration documentation
- [Migration Complete](./MIGRATION_COMPLETE.md) - Migration summary
- [Component Documentation](./docs/components.md) - Component reference (if available)

## 🤝 Contributing

1. Follow the existing code style
2. Use TypeScript for all new code
3. Add loading and error states
4. Ensure accessibility compliance
5. Test on multiple browsers

## 📄 License

[Your License Here]

## 🙏 Acknowledgments

Built with modern web technologies and best practices for a production-ready email marketing platform.

---

**Status**: ✅ Production Ready
**Last Updated**: January 19, 2025
