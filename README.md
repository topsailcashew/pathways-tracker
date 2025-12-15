
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

### 3. **Member Profiles & AI Integration**
*   **Visual Pathway Tracker:** Progress bars showing exactly where a member is in their integration journey (e.g., "Sunday Exp" → "Connect Group").
*   **Gemini AI Analysis:** Uses Google's **Gemini 2.5 Flash** model to analyze member notes/history and suggest the next best action or flag stalled progress.
*   **AI-Drafted Messaging:** Generate personalized, warm follow-up SMS or Emails using AI based on the member's current context.
*   **History Logs:** Dedicated sections for Message Logs (SMS/Email history) and Notes.

### 4. **Task Management**
*   **Task List:** Track follow-ups, meeting reminders, and administrative tasks.
*   **Prioritization:** Visual indicators for High/Medium/Low priority and Overdue tasks.
*   **Notification Center:** Quick access to tasks due within 48 hours with "One-click Email Reminder" functionality.

### 5. **Customizable Settings**
*   **Church Identity:** Configure church name, location, and service times.
*   **Pathway Editor:** Fully customizable drag-and-drop editor for pathway stages. Rename, reorder, add, or delete stages to match your specific church process.
*   **Team Management:** Manage volunteer and admin access (Mock UI).

## 🛠 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **Icons:** React Icons (Ionicons 5)
*   **Charts:** Recharts
*   **AI:** Google GenAI SDK (`@google/genai`)

## ⚙️ Environment Setup

To enable AI features, you must configure your Google Gemini API Key.

1.  Create a `.env` file in the root directory.
2.  Add your API key:
    ```env
    API_KEY=your_gemini_api_key_here
    ```

## 📂 Project Structure

```text
├── components/          # React components
│   ├── Dashboard.tsx    # Main analytics view
│   ├── PeopleList.tsx   # Member directory & filters
│   ├── MemberDetail.tsx # Profile modal (Container)
│   ├── CommunicationLog.tsx # Messaging & AI Logic
│   ├── TaskList.tsx     # Task management view
│   ├── SettingsPage.tsx # Configuration & Pathway editor
│   ├── AddMemberModal.tsx # Form & CSV Import logic
│   └── ...
├── services/
│   ├── geminiService.ts # Google Gemini AI integration
│   └── communicationService.ts # Mock SMS/Email providers
├── types.ts             # TypeScript interfaces
├── context/             # Global Application State
├── App.tsx              # Main layout and routing logic
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

---
*Built for the Google Gemini API Developer Competition.*
