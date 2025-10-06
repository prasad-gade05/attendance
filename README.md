# TimeFlow - Smart Schedule Management

TimeFlow is a comprehensive timetable and attendance management application designed to help students and professionals keep track of their schedules with ease. Built with modern web technologies, it offers a seamless and intuitive experience for managing subjects, timetables, and attendance, all stored locally in your browser.

## ✨ Features

### 📅 Timetable Management

- **Visual Timetable**: An interactive weekly grid to visualize your schedule.
- **Subject Management**: Add, edit, and delete subjects with custom names and colors.
- **Flexible Time Slots**: Create and manage time slots for your daily schedule.
- **Combine Slots**: Merge multiple time slots for longer lectures or sessions.
- **Persistent Storage**: All your data is saved locally in your browser using IndexedDB.

### 📋 Daily Schedule & Attendance

- **Daily Schedule View**: See all your classes for any selected day.
- **Calendar Navigation**: Easily navigate to any date using the built-in calendar.
- **Attendance Tracking**: Mark lectures as "Attended," "Missed," or "Cancelled."
- **Subject Verification**: Change the subject for a specific lecture if it differs from the schedule.
- **Term Settings**: Define your academic term's start and end dates for accurate tracking.
- **Special Dates**: Mark dates as "Holidays" or "Exam Days" to exclude them from your schedule.
- **Extra Classes**: Add extra classes for any date, with custom time slots if needed.

### 📊 Advanced Features

- **Attendance Statistics**: Get detailed insights into your attendance with an overall summary and per-subject breakdown.
- **Attendance Simulation**: Set a target attendance percentage and find out how many classes you need to attend or can skip to achieve your goal.
- **Theme Switching**: Choose between a light and dark theme for your comfort.
- **Data Management**: Clear all your data to start fresh at any time.

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
