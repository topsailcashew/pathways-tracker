
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

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** React Icons (Ionicons 5)
*   **Charts:** Recharts
*   **AI:** Google GenAI SDK (`@google/genai`)

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

### Development Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd pathways-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure environment variables**
    ```bash
    cp .env.example .env
    # Edit .env and add your API key
    ```

4.  **Start development server**
    ```bash
    npm run dev
    ```

### Environment Variables

Create a `.env` file with:
```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_APP_ENV=development
VITE_ENABLE_AI_FEATURES=true
```

**Security Note**: The API key is currently exposed in the frontend. For production, move AI calls to a backend server.

## 🚀 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run format       # Format code with Prettier
npm run type-check   # Check TypeScript types
npm run validate     # Run all checks (lint, format, types)
```

## 📂 Project Structure

```text
├── components/          # React components
│   ├── Dashboard.tsx    # Main analytics view
│   ├── PeopleList.tsx   # Member directory & filters
│   ├── MemberDetail.tsx # Profile modal
│   ├── ErrorBoundary.tsx # Error handling
│   └── ...
├── services/            # Business logic
│   ├── geminiService.ts # AI integration
│   ├── automationService.ts # Automation rules
│   └── communicationService.ts # Email/SMS
├── utils/               # Utility functions
│   ├── validation.ts    # Input validation
│   ├── logger.ts        # Logging system
│   ├── env.ts           # Environment config
│   └── monitoring.ts    # Health checks
├── context/             # React Context for state
├── types.ts             # TypeScript definitions
├── App.tsx              # Main app component
└── index.tsx            # Entry point
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
