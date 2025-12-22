
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

## ⚠️ Production Readiness Status

**IMPORTANT**: This is currently a **frontend prototype**. Before deploying to production:
- Read [`DEPLOYMENT_LIMITATIONS.md`](./DEPLOYMENT_LIMITATIONS.md)
- Review [`SECURITY.md`](./SECURITY.md)
- Check [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md)

### What's Been Done for Production ✅
- ✅ Security headers and CSP configuration
- ✅ Input validation and sanitization
- ✅ Error boundaries and logging system
- ✅ TypeScript strict mode
- ✅ Build optimizations and code splitting
- ✅ Environment variable management
- ✅ ESLint and Prettier setup

### Critical TODOs Before Production ⚠️
- ⚠️ Backend API server (API keys exposed in frontend)
- ⚠️ Real authentication (currently simulated)
- ⚠️ Database integration (data lost on refresh)
- ⚠️ Email/SMS services
- ⚠️ Testing suite

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

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd pathways-tracker
    ```

2.  **Install dependencies** (installs for both apps)
    ```bash
    npm install
    ```

3.  **Configure environment variables**

    **Frontend** (`apps/web/.env`):
    ```bash
    cp apps/web/.env.example apps/web/.env
    # Add your Gemini API key
    ```

    **Backend** (`apps/api/.env`):
    ```bash
    cp apps/api/.env.example apps/api/.env
    # Configure database, JWT secrets, and service credentials
    ```

4.  **Set up database** (backend only)
    ```bash
    npm run prisma:generate --workspace=pathways-tracker-backend
    npm run prisma:migrate --workspace=pathways-tracker-backend
    ```

5.  **Start development servers**

    Run both apps simultaneously:
    ```bash
    npm run dev:all
    ```

    Or run individually:
    ```bash
    npm run dev:web    # Frontend only (http://localhost:5173)
    npm run dev:api    # Backend only (http://localhost:4000)
    ```

### Environment Variables

**Frontend** (`apps/web/.env`):
```env
VITE_API_URL=http://localhost:4000
VITE_APP_ENV=development
VITE_ENABLE_AI_FEATURES=true
```

**Backend** (`apps/api/.env`):
```env
DATABASE_URL=postgresql://user:password@localhost:5432/pathways
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your_gemini_api_key_here
# See apps/api/.env.example for full list
```

## 🚀 Available Scripts

### Root-level Commands

```bash
# Development
npm run dev:all      # Run both frontend and backend
npm run dev:web      # Frontend only
npm run dev:api      # Backend only

# Build
npm run build        # Build both apps
npm run build:web    # Build frontend only
npm run build:api    # Build backend only

# Testing
npm run test         # Run tests in both apps
npm run test:web     # Frontend tests only
npm run test:api     # Backend tests only

# Code Quality
npm run lint         # Lint both apps
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run clean        # Clean all dependencies
```

### Frontend-specific (`apps/web`)

```bash
npm run dev --workspace=pathway-tracker          # Dev server
npm run build --workspace=pathway-tracker        # Production build
npm run type-check --workspace=pathway-tracker   # TypeScript check
npm run validate --workspace=pathway-tracker     # All checks
```

### Backend-specific (`apps/api`)

```bash
npm run dev --workspace=pathways-tracker-backend           # Dev server
npm run build --workspace=pathways-tracker-backend         # Build
npm run prisma:generate --workspace=pathways-tracker-backend  # Generate Prisma client
npm run prisma:migrate --workspace=pathways-tracker-backend   # Run migrations
npm run prisma:studio --workspace=pathways-tracker-backend    # Database GUI
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

- [`SECURITY.md`](./SECURITY.md) - Security policy and best practices
- [`PRODUCTION_READINESS.md`](./PRODUCTION_READINESS.md) - Production deployment checklist
- [`DEPLOYMENT_LIMITATIONS.md`](./DEPLOYMENT_LIMITATIONS.md) - Current limitations
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Contribution guidelines
- [`API.md`](./API.md) - API documentation

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
