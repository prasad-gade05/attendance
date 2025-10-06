Smart Schedule & Attendance Management

This is a modern, powerful, and intuitive application designed to provide a comprehensive solution for managing academic or professional schedules and attendance. It goes beyond simple tracking by offering intelligent tools to help you stay organized, meet your attendance goals, and manage your time effectively. All data is stored locally in your browser, ensuring privacy and offline access.

## Live Demo

- [Demo](https://prasad-gade05.github.io/attendance/)

## ✨ Why it is More Than Just an Attendance Tracker

This application is engineered to be a proactive tool for schedule management. While it covers all the essentials, its advanced features are what make it stand out:

### 🚀 Key Advanced Features

- **Attendance Simulation**: Set a target attendance percentage (e.g., 75%) and let TimeFlow calculate how many future classes you need to attend or can afford to miss. This feature provides a clear path to achieving your attendance goals.
- **Import Historical Data**: Already have attendance records? Import them for any subject up to a specific date. The imported data is locked, preventing accidental changes and ensuring a clean slate for future tracking.
- **Dynamic & Flexible Schedule**:
  - **Extra Classes**: Easily add extra classes to any date, with the option to use existing or create new time slots.
  - **Special Dates**: Mark any day as a "Holiday" or "Exam Day" to automatically exclude it from your schedule and attendance calculations.
  - **On-the-Fly Subject Swapping**: If a different subject is taught during a scheduled slot, you can easily change it for that specific day without altering your base timetable.
- **Comprehensive Term Management**: Define your academic term with start and end dates. TimeFlow uses this period to provide accurate attendance statistics and scheduling, ensuring that only relevant days are active.

### 📊 Core Features

- **Visual Timetable**: A clean, interactive weekly grid to build and visualize your schedule.
- **Subject & Time Slot Management**: Add, edit, and delete subjects with custom names and colors. Create and manage time slots to fit your daily routine.
- **Combine Slots**: Merge consecutive time slots for longer lectures, labs, or sessions.
- **Daily Schedule View**: A dedicated view to see all your classes for any selected day, with easy navigation via a built-in calendar.
- **Detailed Attendance Tracking**: Mark lectures as "Attended," "Missed," or "Cancelled" with a single click.
- **In-Depth Statistics**: Get detailed insights into your attendance with an overall summary and a per-subject breakdown, including percentages and lecture counts.
- **Modern UI with Theming**: A clean, responsive interface with both light and dark themes to suit your preference.
- **Local Data Storage**: All your data is securely stored in your browser using IndexedDB, which means it's private and available offline.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/prasad-gade05/attendance
   ```
2. **Navigate to the project directory:**
   ```bash
   cd attendance
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Run the development server:**
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:5173`.

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **Database**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) with [Dexie.js](https://dexie.org/)
- **Routing**: [React Router](https://reactrouter.com/)
- **Date Management**: [date-fns](https://date-fns.org/)

## 📂 Project Structure

```
D:/AI_SLOP/attend20/
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI components
│   │   ├── AttendanceStatsPanel.tsx
│   │   ├── Timetable.tsx
│   │   └── TodaySchedule.tsx
│   ├── contexts/           # React contexts (e.g., ThemeContext)
│   ├── hooks/              # Custom hooks for state management
│   │   ├── useSchedule.tsx # Logic for daily schedule and attendance
│   │   └── useTimetable.tsx# Logic for timetable management
│   ├── lib/                # Libraries and utility functions
│   │   ├── db.ts           # Dexie.js database setup
│   │   └── utils.ts        # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── App.tsx             # Main application component
├── public/                 # Static assets
└── package.json            # Project configuration
```
