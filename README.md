
# Pathway Tracker

**Pathway Tracker** is a comprehensive church integration platform designed to track and manage the journeys of Newcomers and New Believers. It combines robust member management with AI-assisted insights to ensure no one falls through the cracks.

## 🚀 Key Features

### 1. **Interactive Dashboard**
*   **Real-time Analytics:** Visualizes the "Newcomer Pathway Flow" and "Faith Journey Milestones" using interactive charts.
*   **KPI Cards:** Quick view of Total People, Active Pipeline, New Believers, and Pending Tasks.
*   **Activity Feed:** Recent updates on member statuses and notes, now interactable to quickly view member details.

### 2. **People Management**
*   **Directory:** Filterable list of all members by Pathway (Newcomer/New Believer) and Status (Active/Integrated/Inactive).
*   **Bulk Import:** Add members via **CSV upload** with support for custom templates.
*   **Auto-Welcome:** Automatically send welcome emails to new members imported via CSV (configurable in Settings).
*   **Household Linking:** Smart search to link spouses and family members into households.

### 3. **Member Profiles & AI Integration**
*   **Visual Pathway Tracker:** Progress bars showing exactly where a member is in their integration journey (e.g., "Sunday Exp" → "Connect Group").
*   **Gemini AI Analysis:** Uses Google's **Gemini 2.5 Flash** model to analyze member notes/history and suggest the next best action or flag stalled progress.
*   **AI-Drafted Messaging:** Generate personalized, warm follow-up SMS or Emails using AI based on the member's current context.
*   **History Logs:** Dedicated sections for Message Logs (SMS/Email history) and Notes.

### 4. **Smart Automation**
*   **Auto-Advance Rules:** Configure pathways to automatically move people to the next stage based on specific triggers:
    *   **Task Completion:** E.g., When "Attend Newcomers Lunch" task is marked complete, move person to "Lunch" stage.
    *   **Time Duration:** E.g., Automatically advance a person after 14 days in the "Sunday Exp" stage.
*   **Notification Center:** Quick access to tasks due within 48 hours with "One-click Email Reminder" functionality.

### 5. **Customizable Settings**
*   **Church Identity:** Configure church name, location, and service times.
*   **Pathway Editor:** Fully customizable drag-and-drop editor. Rename, reorder, add, or delete stages to match your specific church process.
*   **Integrations:** Connect Google Sheets for automated data ingestion.

## 🛠 Tech Stack

### Frontend (`apps/web`)
*   **Framework:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** React Icons (Ionicons 5)
*   **Charts:** Recharts
*   **AI:** Google GenAI SDK (`@google/genai`)
*   **Build Tool:** Vite

### Backend (`apps/api`)
*   **Framework:** Express.js, TypeScript
*   **Database:** PostgreSQL with Prisma ORM
*   **Authentication:** JWT with bcrypt
*   **Queue:** Bull (Redis-based)
*   **Email:** SendGrid
*   **SMS:** Twilio
*   **API Docs:** Swagger/OpenAPI

## 🚀 Quick Start

**New to the project?** Get up and running in 5 minutes:

👉 **[Read the Getting Started Guide →](./GETTING_STARTED.md)**

The guide covers:
- Database setup (Supabase or local PostgreSQL)
- Environment configuration
- Running migrations and seeding test data
- Starting the application
- Test user accounts with different permission levels

## ✅ Implementation Status

**Current Progress: 95% Complete - Production Ready**

### What's Working
- ✅ **Full-stack architecture** - React 19 frontend + Express backend fully integrated
- ✅ **PostgreSQL database** with Prisma ORM
- ✅ **JWT authentication** with refresh tokens
- ✅ **Role-based access control (RBAC)** - 4 permission levels with 40+ granular permissions
- ✅ **Complete API integration** - All frontend pages use backend APIs (no mock data)
- ✅ **All backend services** - 11 services, 35+ API endpoints
- ✅ **All frontend features** - Analytics, Settings, Users, Members, Tasks, Communications
- ✅ **AI features** - Google Gemini integration for smart messaging
- ✅ **Email/SMS** - Real SendGrid and Twilio integration
- ✅ **Security** - Input validation (Zod), rate limiting, error handling
- ✅ **UX enhancements** - Global search, keyboard shortcuts, CSV import, loading states
- ✅ **Comprehensive test suite** - 40+ backend tests (unit + integration)

### Fully Integrated Systems
All major systems are complete and working:
- Members management with full CRUD
- Task management with automation
- Stage/pathway management UI
- Analytics dashboard with charts
- Settings and configuration
- User management
- Communications (bulk email/SMS)
- Integration framework (Google Sheets ready)

## ⚙️ Environment Setup

### Monorepo Structure

This project uses npm workspaces to manage both frontend and backend in a single repository:

```text
pathways-tracker/
├── apps/
│   ├── web/              # Frontend React app
│   └── api/              # Backend Express API
├── package.json          # Root workspace config
└── docs/
```

### Development Setup

**Quick Setup:**

```bash
# 1. Clone and install
git clone <repository-url>
cd pathways-tracker
npm install

# 2. Set up database (see GETTING_STARTED.md for detailed instructions)
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 3. Start both apps
cd ../..
npm run dev
```

**Full instructions:** See [GETTING_STARTED.md](./GETTING_STARTED.md) for detailed setup with database configuration, environment variables, and troubleshooting.

### Environment Variables

**Frontend** (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:4000
VITE_APP_ENV=development
VITE_ENABLE_AI_FEATURES=true
```

**Backend** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/pathways_tracker
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your_gemini_api_key_here  # Optional - for AI features
REDIS_URL=redis://localhost:6379  # Optional - for session management
# See apps/api/.env.example for full list
```

**Note:** Both `.env` files are already created with defaults. Update the `DATABASE_URL` in the backend to match your database connection.

## 🚀 Available Scripts

### Root-level Commands

```bash
# Development
npm run dev          # Run both frontend and backend concurrently

# Individual apps
cd apps/web && npm run dev    # Frontend only (http://localhost:3000)
cd apps/api && npm run dev    # Backend only (http://localhost:4000)

# Build
npm run build        # Build both apps

# Database (from apps/api directory)
cd apps/api
npx prisma migrate dev      # Run database migrations
npx prisma db seed          # Seed with test data
npx prisma studio           # Open database GUI
npx prisma generate         # Generate Prisma client

# Install dependencies
npm install                  # Installs for all workspaces
```

### Quick Database Commands

```bash
# Reset and reseed database (⚠️ deletes all data)
cd apps/api
npx prisma migrate reset

# View database in browser
cd apps/api
npx prisma studio  # Opens at http://localhost:5555
```

## 📂 Project Structure

```text
pathways-tracker/
├── apps/
│   ├── web/                    # Frontend React Application
│   │   ├── components/         # React components
│   │   │   ├── Dashboard.tsx   # Main analytics view
│   │   │   ├── PeopleList.tsx  # Member directory
│   │   │   ├── MemberDetail.tsx # Profile modal
│   │   │   └── ...
│   │   ├── services/           # Frontend business logic
│   │   │   ├── geminiService.ts # AI integration
│   │   │   └── communicationService.ts
│   │   ├── utils/              # Utility functions
│   │   ├── context/            # React Context
│   │   ├── App.tsx             # Main component
│   │   ├── index.tsx           # Entry point
│   │   └── package.json
│   │
│   └── api/                    # Backend Express API
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   │   ├── auth.routes.ts
│       │   │   ├── members.routes.ts
│       │   │   └── tasks.routes.ts
│       │   ├── services/       # Business logic
│       │   │   ├── auth.service.ts
│       │   │   ├── member.service.ts
│       │   │   └── task.service.ts
│       │   ├── middleware/     # Express middleware
│       │   │   ├── auth.middleware.ts
│       │   │   └── permissions.middleware.ts
│       │   ├── config/         # Configuration
│       │   │   ├── database.ts
│       │   │   └── swagger.ts
│       │   └── index.ts        # Server entry
│       ├── prisma/
│       │   └── schema.prisma   # Database schema
│       ├── tests/              # Backend tests
│       └── package.json
│
├── docs/                       # Documentation
│   └── plans/                  # Design documents
├── package.json                # Root workspace config
└── README.md
```

## 🤖 AI Capabilities

This app utilizes the **Gemini 2.5 Flash** model for:
1.  **Message Generation:** "Draft a text to John, who just attended the 'Next Steps' class."
2.  **Journey Analysis:** "Analyze Jane's notes. Is she 'Stalled', 'On Track', or 'Needs Attention'? Why?"

## 📝 CSV Import Format

To bulk import members, upload a CSV file with the following headers:
`First Name, Last Name, Email, Phone, Pathway`

*   **Pathway:** Must be either "Newcomer" or "New Believer".
*   *Note: A template can be downloaded directly from the import modal.*

## 🎨 Design System

The app features a clean, "ChurchTech" aesthetic using a calming blue palette:
*   **Navy (#0A1931):** Sidebar & Headings
*   **Ocean (#4A7FA7):** Accents & Secondary Metrics
*   **Background (#F6FAFD):** Light/Airy interface
*   **Success (#10B981):** Completion indicators

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:
- Code style and conventions
- Development workflow
- Pull request process
- Security guidelines

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📚 Documentation

- [`GETTING_STARTED.md`](./GETTING_STARTED.md) - Detailed setup guide
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines (coming soon)
- [`SECURITY.md`](./SECURITY.md) - Security policy (coming soon)

## 🆘 Support

- 📧 Email: support@yourchurch.org
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/pathways-tracker/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/pathways-tracker/discussions)

## 🙏 Acknowledgments

- Built with [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/)
- AI powered by [Google Gemini API](https://ai.google.dev/)
- Icons by [React Icons](https://react-icons.github.io/react-icons/)
- Charts by [Recharts](https://recharts.org/)

---
*Built for the Google Gemini API Developer Competition.*
*Made with ❤️ for churches worldwide.*
