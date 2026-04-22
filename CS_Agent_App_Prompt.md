# CS Agent Dashboard - Application Prompt

**Role:** Expert Full-Stack AI Engineer & UI/UX Designer

**Task:** Build a comprehensive, AI-powered Customer Service (CS) Agent Dashboard named "CS Agent" (version 1.6). This tool is designed to assist customer service agents (specifically in the ride-hailing/taxi industry) with daily tasks, communication, and support resolution.

## Technical Stack
*   **Frontend:** React 18, Vite, TypeScript
*   **Styling:** Tailwind CSS (utility-first, clean, modern, and professional UI)
*   **Icons:** `lucide-react`
*   **Animations:** `motion/react` (Framer Motion)
*   **Database & Auth:** Firebase (Firestore for data storage, Firebase Auth for authentication)
*   **AI Integration:** `@google/genai` (Google Gemini API using `process.env.GEMINI_API_KEY`)
*   **Notifications:** `react-hot-toast`

## Core Requirements & Architecture
The application layout must consisting of a responsive sidebar for navigation and a main content area. Unauthenticated users must see a Login Screen. Once authenticated, they enter the dashboard. The app should have a "Tutorial/How to Use" modal and a command palette. 

### Data Persistence (Firebase)
*   User data (Macros, Links, Templates, Workflows) must be stored in Firestore.
*   Implement a robust Firebase Security ruleset ensuring individuals can only read/write their own data using `request.auth.uid`.

### AI Integration & Error Handling Requirements
*   **Models:** Use `gemini-3-flash-preview` as the primary reasoning model.
*   **Robust Fallback Logic:** Wrap EVERY Gemini API call in a `try...catch` block. If a request fails with an error indicating `429`, `RESOURCE_EXHAUSTED`, `quota`, `403`, or `PERMISSION_DENIED`, explicitly log a warning and fall back automatically to `gemini-2.5-flash` to bypass free-tier rate limits.
*   **User Notifications:** If the fallback also fails due to quota, show a specific error toast: "API quota exceeded. Please wait a minute and try again, or add your own API key in Settings."

### Navigation & Features (Tabs)

**1. Dashboard**
*   An overview of the agent's available tools.

**2. AI Draft & Save**
*   **Purpose:** Generate customer support replies.
*   **AI Prompt Rules:** The AI MUST NOT repeat the rider's or driver's words back to them. The AI MUST NOT blame the company under any circumstances. Ensure professional, empathetic, and concise responses.

**3. Macros (Cloud Saved)**
*   A CRUD interface to save, edit, and copy frequently used text snippets.

**4. Templates**
*   Pre-built template responses for common scenarios.

**5. Workflows (Ticket Maker)**
*   A tool to build step-by-step issue resolution tickets and standard operating procedures.

**6. Updates**
*   A board for system updates or team announcements.

**7. Translator**
*   An AI-powered tool to translate text accurately into multiple languages, tailored for customer service context.

**8. Speech to Text**
*   Accepts audio input (via file upload or microphone) and transcribes it using Gemini's multimodal capabilities (`audio/mp3`, etc. alongside text prompts).

**9. Grammar Check**
*   Proofreads text using AI and allows users to change the tone (e.g., Neutral, Professional, Friendly).

**10. Rephrase Text**
*   **Purpose:** Takes input text and rewrites it.
*   **Features:** Dropdown for Tone/Style (Professional, Casual, Friendly, Formal, Concise, Expand, Empathetic). Uses Gemini to rewrite the text precisely according to the selected tone.

**11. Ask Captain**
*   AI assistant tailored to help the CS agent formulate requests or communicate effectively with drivers/captains.

**12. Toll Gates (UAE)**
*   **Purpose:** An interactive calculator for UAE toll gates (Salik in Dubai, Darb in Abu Dhabi).
*   **Features:** Input for Pick-up, Drop-off, and Time. A dropdown for "Toll Rate per Gate" defaulting to "4 AED (Official Government Rate)", with other surcharge options.
*   **Maps:** Include map iframes (targeting Yandex Maps and Google Maps) to display the route.
*   **AI Agent:** Passes route info to Gemini to estimate the exact number of tolls crossed, taking Darb's peak hours routing into consideration.

**13. Calculator**
*   A standard, clean UI calculator for quick math.

**14. Links**
*   A bookmark manager to save external URLs to Firestore.

**15. Backup & Restore**
*   Allows the user to Export all their Macros, Links, Templates, and Workflows to a `.json` file (`version 1.5`), and Import them back, safely sanitizing and merging with existing Firebase data.

## UI/UX Guidelines
*   **Color Palette:** Use Slate for neutral bases, and Indigo/Violet gradients for primary actions and highlights.
*   **Empty States:** Provide helpful, descriptive empty states when no data is present.
*   **Feedback:** Use loading spinners on buttons during async requests. Display success/error toasts for all CRUD operations and clipboard actions.
*   **State Management:** Include "Reset" and "Cancel" global event listeners to clear inputs when moving between tasks.
