# TimeFlow - Smart Schedule Management

A comprehensive timetable and attendance management application built with React, TypeScript, and IndexedDB for persistent storage. Features both timetable creation and daily schedule tracking with attendance monitoring.

## ✨ Features

### 📅 **Timetable Management**
- **Visual Timetable**: Interactive weekly grid with time slots and subjects
- **Subject Management**: Add, edit, delete subjects with custom colors
- **Time Slot Management**: Flexible time slots with precise timing
- **Slot Combination**: Combine multiple time slots for longer sessions
- **Persistent Storage**: Local storage using IndexedDB

### 📋 **Today's Schedule**
- **Daily Schedule View**: See all lectures for any selected day
- **Calendar Navigation**: Pick any date to view its schedule
- **Attendance Tracking**: Mark lectures as attended/missed/cancelled
- **Subject Verification**: Confirm or change the actual subject taught
- **Holiday/Exam Management**: Mark dates as holidays or exam days
- **Extra Classes**: Add additional classes for specific dates
- **Term Settings**: Define term start/end dates for accurate calculations

### 📊 **Advanced Features**
- **Attendance Statistics**: Comprehensive stats by subject and overall
- **Smart Calculations**: Automatic calculation of total lectures from term start
- **Holiday Exclusion**: Holidays and exam days excluded from calculations
- **Subject Changes**: Track when different subjects were taught than scheduled
- **Progress Tracking**: Visual progress bars and percentage calculations

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd attend20

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

| Command        | Description                       |
| -------------- | --------------------------------- |
| `pnpm dev`     | Start development server with HMR |
| `pnpm build`   | Build for production              |
| `pnpm preview` | Preview production build locally  |
| `pnpm lint`    | Run ESLint for code quality       |

## 📱 Usage Guide

### Setting Up Your Timetable

1. **Add Subjects**
   - Click "Add Subject" button
   - Enter subject name and choose a color
   - Subjects will be available for scheduling

2. **Create Time Slots**
   - Click "Add Time Slot"
   - Set start and end times
   - Time slots create the grid structure

3. **Assign Subjects to Slots**
   - Click on any cell in the timetable
   - Select a subject from the dropdown
   - The cell will display the subject with its color

4. **Combine Time Slots**
   - Click "Combine Slots" to enter combination mode
   - Select multiple adjacent slots on the same day
   - Combine them for longer lecture sessions

### Using Today's Schedule

1. **Set Term Dates**
   - Click "Term Settings" button
   - Set your academic term start and end dates
   - Only dates within the term will show schedules

2. **Navigate to Schedule**
   - Click "Today's Schedule" in the header
   - Use the calendar to select any date
   - View all lectures scheduled for that day

3. **Mark Attendance**
   - For each lecture, choose: Attended/Missed/Cancelled
   - Verify the actual subject taught (if different from scheduled)
   - Changes are automatically saved

4. **Manage Special Dates**
   - Mark dates as holidays or exam days
   - Special dates won't show any schedule
   - Excluded from attendance calculations

5. **Add Extra Classes**
   - Click "Add Extra Class" for additional sessions
   - Choose time slot and subject
   - Separate from regular timetable

6. **View Statistics**
   - Click "Stats" to see attendance analytics
   - Overall and subject-wise attendance percentages
   - Total lectures conducted vs attended

## 🏗️ Technical Architecture

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI Framework |
| TypeScript | 5.5.3 | Type Safety |
| Vite | 5.4.1 | Build Tool |
| Tailwind CSS | 3.4.11 | Styling |
| Dexie.js | 4.2.0 | IndexedDB ORM |
| React Router | 6.26.2 | Navigation |
| date-fns | 3.6.0 | Date Utilities |
| shadcn/ui | Latest | UI Components |

### Data Models

#### Core Entities
```typescript
interface Subject {
  id: string
  name: string
  color: string
}

interface TimeSlot {
  id: string
  startTime: string
  endTime: string
}

interface DaySlot {
  id: string
  timeSlotId: string
  day: string
  subjectId?: string
}
```

#### Schedule & Attendance
```typescript
interface AttendanceRecord {
  id: string
  date: string
  timeSlotId: string
  originalSubjectId?: string
  actualSubjectId?: string
  status: 'attended' | 'missed' | 'cancelled'
  isVerified: boolean
}

interface SpecialDate {
  id: string
  date: string
  type: 'holiday' | 'exam'
  description?: string
}

interface ExtraClass {
  id: string
  date: string
  timeSlotId: string
  subjectId: string
  description?: string
}
```

### Project Structure

```
src/
├── components/
│   ├── TodaySchedule.tsx       # Main schedule page
│   ├── TodayScheduleItem.tsx   # Individual lecture item
│   ├── ExtraClassDialog.tsx    # Add extra classes
│   ├── TermSettingsDialog.tsx  # Term configuration
│   ├── AttendanceStatsPanel.tsx # Statistics view
│   ├── Timetable.tsx           # Timetable grid
│   ├── Header.tsx              # Navigation header
│   └── ui/                     # Reusable UI components
├── hooks/
│   ├── useTimetable.tsx        # Timetable data management
│   └── useSchedule.tsx         # Schedule & attendance logic
├── lib/
│   └── db.ts                   # IndexedDB configuration
├── types/
│   └── index.ts                # TypeScript definitions
└── utils/
    └── utils.ts                # Utility functions
```

## 📊 Attendance Calculation Logic

### Total Lectures Calculation

The system calculates total lectures using this algorithm:

1. **Get all days** in the term period up to today
2. **Exclude special dates** (holidays/exams)
3. **Process each day:**
   - Find scheduled lectures for that day
   - Handle combined slots (count only once)
   - Check for attendance records
   - Account for subject changes
   - Include extra classes

### Example Calculation

**Scenario:**
- Subject A: 2 lectures Mon + 2 lectures Tue
- Subject B: 3 lectures Tue + 2 lectures Wed
- Term: 3 weeks, completed 2 weeks

**Week 1:** Monday = Holiday, Tuesday = Normal
- Subject A: 2 lectures (only Tuesday)
- Subject B: 3 lectures (Tuesday)

**Week 2:** All normal days
- Subject A: 4 lectures (Mon + Tue)
- Subject B: 5 lectures (Tue + Wed)

**Total after 2 weeks:**
- Subject A: 6 lectures
- Subject B: 8 lectures

### Special Cases Handled

- **Cancelled lectures:** Not counted in total
- **Subject changes:** Moved to actual subject
- **Combined slots:** Counted as one lecture
- **Extra classes:** Added to totals
- **Outside term:** Ignored completely

## 🎨 UI/UX Features

### Design Principles
- **Clean Interface:** Minimalist design focused on functionality
- **Color Coding:** Subjects distinguished by colors
- **Responsive Layout:** Works on desktop and mobile
- **Intuitive Navigation:** Clear visual hierarchy

### Interactive Elements
- **Visual Feedback:** Hover states and animations
- **Status Indicators:** Color-coded attendance status
- **Progress Visualization:** Percentage bars and statistics
- **Modal Dialogs:** For complex operations

### Accessibility
- **Keyboard Navigation:** Full keyboard support
- **Screen Reader Friendly:** Proper ARIA labels
- **Color Contrast:** Meets WCAG guidelines
- **Focus Management:** Clear focus indicators

## 🚀 Development

### Environment Setup

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Code Quality

- **TypeScript:** Strict type checking
- **ESLint:** Code quality rules
- **Prettier:** Code formatting
- **Tailwind:** Utility-first CSS

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit: `git commit -m 'Add new feature'`
5. Push: `git push origin feature/new-feature`
6. Create Pull Request

## 📈 Future Enhancements

### Planned Features
- **Export/Import:** Backup and restore data
- **Notifications:** Lecture reminders
- **Analytics Dashboard:** Advanced reporting
- **Multi-term Support:** Handle multiple terms
- **Sync Options:** Cloud synchronization
- **Mobile App:** React Native version

### Performance Optimizations
- **Virtual Scrolling:** For large timetables
- **Caching:** Improved data access
- **Lazy Loading:** Component optimization
- **Bundle Splitting:** Faster initial load

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **shadcn/ui:** Beautiful UI components
- **Tailwind CSS:** Utility-first CSS framework
- **Dexie.js:** IndexedDB wrapper
- **React Router:** Client-side routing
- **date-fns:** Date utility library