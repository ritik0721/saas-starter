# 🚀 SaaS Starter - Leave Management System

A modern, full-stack SaaS application built with Next.js 15, featuring comprehensive leave management capabilities similar to Timetastic. This project demonstrates modern web development practices with a focus on user experience, security, and scalability.

## ✨ Features Completed

### 🔐 Authentication & User Management
- **Multi-Provider Authentication**
  - Traditional email/password authentication
  - Google OAuth 2.0 integration
  - JWT-based session management
  - Secure password handling for OAuth users

- **Role-Based Access Control (RBAC)**
  - **Owner**: Full system access, user management, company settings
  - **Admin**: Team management, approvals, policies, analytics
  - **Member**: Leave requests, personal dashboard, team calendar view

### 🏢 Core Infrastructure
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Custom JWT-based system with OAuth support
- **API**: RESTful API routes with proper validation
- **UI Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for smooth interactions

### 📅 Leave Management System
- **Leave Request Workflow**
  - Multi-step leave request form with date validation
  - Support for different leave types (Annual, Sick, Personal, etc.)
  - Reason tracking and approval workflow
  - Email notifications for all stakeholders

- **Approval System**
  - Manager approval panel with role-based access
  - Urgency indicators for time-sensitive requests
  - Rejection handling with reason tracking
  - Real-time status updates

- **Policy Management**
  - Company-wide leave policies configuration
  - Customizable rules (notice periods, consecutive days, annual limits)
  - Leave type management with color coding
  - Company settings (annual leave days, carry-over rules, fiscal year)

### 📊 Analytics & Reporting
- **Dashboard Analytics**
  - Key metrics (total requests, approval rate, pending requests, processing time)
  - Monthly trends visualization with interactive charts
  - Leave type distribution analysis
  - Cost analysis and team utilization metrics
  - Export functionality (CSV/PDF)

- **Team Calendar**
  - Visual team leave overview
  - Month/week view toggle
  - Leave type filtering
  - Interactive calendar with leave request details

### 📧 Email Notifications
- **Automated Email System**
  - Leave request submitted notifications
  - Approval/rejection notifications
  - Manager alerts for pending requests
  - React Email templates with Resend integration

### 🎨 Modern UI/UX
- **Design System**
  - Inspired by Magic UI and React Bits
  - Gradient backgrounds and modern card designs
  - Smooth animations and hover effects
  - Responsive design for all devices
  - Dark/light mode support (shadcn/ui)

- **Interactive Components**
  - Tabbed navigation for better organization
  - Animated cards with hover effects
  - Progress bars and status indicators
  - Modern form components with validation

## 🚧 In Progress / Next Steps

### 🔄 Immediate Priorities
1. **User Management Dashboard**
   - User invitation system
   - Role assignment and management
   - Team member onboarding
   - User profile management

2. **Advanced Leave Features**
   - Leave balance carry-over logic
   - Holiday calendar integration
   - Blackout date management
   - Bulk leave operations

3. **Enhanced Notifications**
   - Push notifications
   - Slack/Teams integration
   - Custom notification preferences
   - Reminder system

### 📈 Future Enhancements
1. **Advanced Analytics**
   - Predictive analytics for leave patterns
   - Team capacity planning
   - Cost optimization insights
   - Custom report builder

2. **Integration Capabilities**
   - HRIS system integration
   - Payroll system connectivity
   - Calendar app synchronization
   - Mobile app development

3. **Enterprise Features**
   - Multi-tenant architecture
   - Advanced security features
   - Audit logging
   - Compliance reporting

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Charts**: Recharts
- **State Management**: SWR for data fetching

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: Custom JWT + OAuth
- **Email**: React Email + Resend
- **Validation**: Zod schemas

### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel (recommended)
- **Environment**: Environment variables for configuration
- **Version Control**: Git with proper security practices

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Google OAuth credentials (for Google sign-in)

### Installation
```bash
# Clone the repository
git clone <your-repo-url>
cd saas-starter

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Fill in your configuration values

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

### Environment Variables
```bash
# Database
DATABASE_URL=your_postgres_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourcompany.com
COMPANY_NAME=Your Company Name

# Stripe (for future payment features)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

## 📁 Project Structure

```
saas-starter/
├── app/                          # Next.js App Router
│   ├── (dashboard)/             # Dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   │   ├── leave/          # Leave management
│   │   │   ├── general/        # Account settings
│   │   │   └── security/       # Security settings
│   │   └── layout.tsx          # Dashboard layout
│   ├── (login)/                # Authentication routes
│   ├── api/                    # API routes
│   └── layout.tsx              # Root layout
├── components/                  # Reusable UI components
│   └── ui/                     # shadcn/ui components
├── lib/                        # Utility libraries
│   ├── auth/                   # Authentication logic
│   ├── db/                     # Database configuration
│   ├── emails/                 # Email templates
│   └── utils.ts                # Helper functions
├── drizzle.config.ts           # Database configuration
└── package.json                # Dependencies
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions system
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Drizzle ORM with parameterized queries
- **OAuth Security**: Secure Google OAuth implementation
- **Environment Variables**: Secure configuration management

## 📊 Database Schema

The system includes comprehensive tables for:
- **Users**: Authentication and profile information
- **Teams**: Organization structure
- **Leave Types**: Configurable leave categories
- **Leave Requests**: Individual leave applications
- **Leave Policies**: Company-wide rules and settings
- **Leave Allowances**: Annual leave allocations
- **Company Settings**: Global configuration

## 🧪 Testing & Quality

- **TypeScript**: Full type safety
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Build Validation**: Automated build checks
- **Error Handling**: Comprehensive error management

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Setup
- Configure all environment variables in Vercel dashboard
- Set up database connection (Supabase recommended)
- Configure custom domain if needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code examples

## 🎯 Roadmap

### Phase 1: Core Features ✅
- [x] Authentication system
- [x] Leave management
- [x] Basic analytics
- [x] Email notifications

### Phase 2: Advanced Features 🚧
- [ ] User management dashboard
- [ ] Advanced leave policies
- [ ] Enhanced analytics
- [ ] Mobile responsiveness

### Phase 3: Enterprise Features 📋
- [ ] Multi-tenancy
- [ ] Advanced integrations
- [ ] Compliance features
- [ ] Performance optimization

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
