
# ⚠️ Pre-Deployment Checklist & Limitations

This application is currently a **Frontend Prototype**. Before deploying to a production environment (like Vercel, Netlify, or AWS), you must address the following limitations. The current code runs entirely in the browser and uses mock data.

## 1. Data Persistence (Critical)
*   **Current Behavior:** All data (Members, Tasks, Settings, Logs) is stored in **React State (Memory)**.
*   **Limitation:** **Refreshing the browser resets everything** to the initial mock data found in `constants.ts`.
*   **Requirement:** You must connect the app to a real database (Firebase) and implement the API endpoints outlined in `API.md`.

## 2. Authentication & Security
*   **Current Behavior:** Login is simulated. Any email/password combination works or logs you in as the demo user.
*   **Limitation:** There is no user verification, session management, or password hashing.
*   **Security Risk:** The Google Gemini API Key (`process.env.API_KEY`) is currently accessed in the frontend code. In a production build, this key would be exposed to anyone who inspects the browser network traffic.
*   **Requirement:** 
    1. Implement real Auth
    2. Move all AI calls (`geminiService.ts`) to a **Server-Side Proxy/Backend** so the API key is never sent to the client browser.

## 3. Communication Features (Email & SMS)
*   **Current Behavior:** The `communicationService.ts` logs messages to the browser console (`console.log`) to simulate sending.
*   **Limitation:** No actual emails or text messages are sent to users.
*   **Requirement:** Integrate with real providers:
    *   **Email:** Google Mail Service
    *   **SMS:** Twilio

## 4. Google Sheets Integration
*   **Current Behavior:** The app attempts to fetch CSV data directly from Google servers using `fetch()`.
*   **Limitation:** This is highly susceptible to **CORS (Cross-Origin Resource Sharing)** errors. Browsers often block requests from your domain to `docs.google.com`.
*   **Requirement:** implement the official Google Sheets API with OAuth.

## 5. Multi-Tenancy & Billing
*   **Current Behavior:** The "Super Admin Dashboard" uses hardcoded mock data (`MOCK_TENANTS`).
*   **Limitation:** Creating a new account, changing a plan, or viewing billing history does not actually update any system state or process payments.
*   **Requirement:** 
    1. Integrate a payment processor (Selcom payment portal TZ).
    2. Implement tenant isolation in your database (e.g., `tenant_id` column on all tables).

## 6. Deployment Steps (Transition Plan)

To make this app functional, follow this roadmap:

1.  **Backend:** Set up an API route handler.
2.  **Database:** Firestore
3.  **Environment Variables:**
    *   Never commit `.env` files.
    *   Set `API_KEY` on your server dashboard (Vercel/Netlify), not in the public code.
4.  **Refactor Services:**
    *   Rewrite `AppContext.tsx` to fetch data from your API instead of using `useState` mock data.
    *   Rewrite `geminiService.ts` to call your own backend endpoint (e.g., `POST /api/ai/analyze`).

## 7. Current Browser Capabilities
*   ✅ **CSV Import:** The internal CSV parser works fully in the browser.
*   ✅ **ICS Download:** Calendar exports work natively.
*   ✅ **UI/UX:** All buttons, modals, and charts are fully interactive for demonstration purposes.
