# Modern React App Template

A cutting-edge, production-ready React application template built with modern web technologies. This template provides a comprehensive foundation for building sophisticated web applications with beautiful UI components, smooth animations, and excellent developer experience.

## ✨ Features

### 🎨 **Modern Design System**

- **Beautiful UI Components**: Complete shadcn/ui component library with 20+ components
- **Gradient Aesthetics**: Modern gradient backgrounds, text effects, and glass-morphism
- **Dark/Light Themes**: Seamless theme switching with system preference detection
- **Responsive Design**: Mobile-first approach with fluid layouts across all devices
- **Accessibility**: WCAG compliant components with proper ARIA attributes

### 🚀 **Advanced Functionality**

- **Interactive Calendar**: Full-featured calendar component with date selection
- **Date & Time Pickers**: Multiple date/time picker variants (12h/24h, range selection)
- **Smooth Animations**: Framer Motion powered animations and micro-interactions
- **Navigation System**: Modern navbar with active indicators and mobile menu
- **Form Components**: Enhanced form inputs with validation-ready styling

### 💻 **Developer Experience**

- **TypeScript**: Full type safety with strict TypeScript configuration
- **Modern Build Tools**: Vite for lightning-fast development and optimized builds
- **Code Quality**: ESLint and Prettier configured for consistent code style
- **Path Aliases**: Clean imports with `@/` alias configuration
- **Hot Module Replacement**: Instant updates during development

### 🛠 **Production Ready**

- **Optimized Performance**: Tree-shaking, code splitting, and modern bundling
- **SEO Friendly**: Proper meta tags and semantic HTML structure
- **GitHub Pages**: Pre-configured deployment workflow
- **Progressive Enhancement**: Works without JavaScript for core functionality

## 🚀 Tech Stack

| Technology                                      | Version | Purpose        |
| ----------------------------------------------- | ------- | -------------- |
| [React](https://react.dev/)                     | 19.1.1  | UI Framework   |
| [TypeScript](https://www.typescriptlang.org/)   | 5.5.3   | Type Safety    |
| [Vite](https://vitejs.dev/)                     | 5.4.1   | Build Tool     |
| [Tailwind CSS](https://tailwindcss.com/)        | 3.4.11  | Styling        |
| [shadcn/ui](https://ui.shadcn.com/)             | Latest  | UI Components  |
| [Framer Motion](https://www.framer.com/motion/) | 11.0.0  | Animations     |
| [React Router](https://reactrouter.com/)        | 6.26.2  | Routing        |
| [Lucide React](https://lucide.dev/)             | 0.462.0 | Icons          |
| [date-fns](https://date-fns.org/)               | 3.6.0   | Date Utilities |

## 🏁 Quick Start

### Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (recommended) - [Install](https://pnpm.io/installation)

### Installation

```bash
# Clone the repository
git clone https://github.com/prasad-gade05/app_template.git

# Navigate to project directory
cd app_template

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
| `pnpm deploy`  | Deploy to GitHub Pages            |

## 📁 Project Structure

```
app_template/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   │   ├── button.tsx  # Button variations
│   │   │   ├── card.tsx    # Card layouts
│   │   │   ├── calendar.tsx # Calendar component
│   │   │   ├── date-picker.tsx # Date selection
│   │   │   ├── time-picker.tsx # Time selection
│   │   │   └── ...         # 15+ more components
│   │   ├── navbar.tsx      # Navigation component
│   │   ├── footer.tsx      # Footer component
│   │   └── theme-provider.tsx # Theme management
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Homepage
│   │   ├── About.tsx       # About page
│   │   ├── Components.tsx  # Component showcase
│   │   └── Contact.tsx     # Contact form
│   ├── lib/                # Utility functions
│   │   └── utils.ts        # Helper utilities
│   ├── hooks/              # Custom React hooks
│   ├── assets/             # Static assets
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Public assets
├── docs/                   # Documentation
└── package.json           # Dependencies & scripts
```

## 🎨 Component Library

### Basic Components

- **Button**: 5 variants, 4 sizes, with hover animations
- **Card**: Header, content, footer sections with gradient effects
- **Input/Textarea**: Form inputs with focus animations
- **Badge**: Status indicators with multiple variants
- **Avatar**: Profile pictures with fallback support

### Advanced Components

- **Calendar**: Interactive month/year navigation
- **Date Picker**: Single date and range selection
- **Time Picker**: 12h/24h formats with seconds precision
- **Progress**: Animated progress bars
- **Switch**: Toggle controls with smooth transitions
- **Tabs**: Organized content sections
- **Alert Dialog**: Modal confirmations

### Navigation

- **Navbar**: Responsive navigation with mobile menu
- **Footer**: Comprehensive footer with links
- **Theme Toggle**: Dark/light/system theme switching

## 🎯 Page Templates

### 🏠 Homepage (`/`)

- Hero section with animated gradient background
- Feature showcase with hover effects
- Call-to-action sections
- Floating animated elements

### ℹ️ About (`/about`)

- Technology stack overview
- Project structure explanation
- Getting started guide
- Feature highlights

### 🧩 Components (`/components`)

- Interactive component demonstrations
- Organized in tabbed sections
- Live code examples
- Real-time property changes

### 📧 Contact (`/contact`)

- Contact form with validation styling
- Project information cards
- Quick start commands
- Social links

## 🎨 Customization

### Theme Configuration

The template uses CSS custom properties for theming:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  --accent: 210 40% 94%;
  /* ... */
}
```

### Adding Components

1. Create component in `src/components/ui/`
2. Export from the appropriate index file
3. Add to the Components showcase page
4. Update documentation

### Styling Guidelines

- Use Tailwind utility classes
- Leverage CSS custom properties for themes
- Add animations with Framer Motion
- Maintain responsive design principles

## 🚀 Deployment

### GitHub Pages (Recommended)

```bash
# Build and deploy
pnpm deploy
```

### Other Platforms

- **Vercel**: Connect GitHub repository
- **Netlify**: Drag & drop `dist` folder
- **Cloudflare Pages**: Connect GitHub repository

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm lint && pnpm build`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

```
# Timetable Manager

A modern, responsive timetable application built with React, TypeScript, and IndexedDB for persistent storage.

## Features

- **Visual Timetable**: Columns for Monday to Sunday, rows for time slots
- **Subject Management**: Add, edit, and delete subjects with custom colors
- **Time Slot Management**: Add, edit, and delete time slots with flexible timing
- **Slot Combination**: Combine multiple time slots from the same day into a single cell
- **Persistent Storage**: All data stored locally in the browser using IndexedDB
- **Data Management**: Clear all data with a single button

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to `http://localhost:5173`

## Usage

### Adding Subjects

1. Click the "Add Subject" button
2. Enter the subject name and select a color
3. Click "Add Subject"

### Adding Time Slots

1. Click the "Add Time Slot" button
2. Select the day, start time, end time, and optionally a subject
3. Click "Add Time Slot"

### Combining Slots

1. Click the "Combine Slots" button to enter combination mode
2. Click on multiple time slots from the same day to select them
3. Click the "Combine Selected" button to combine the slots

### Uncombining Slots

1. Click the split icon on a combined slot to uncombine it

### Managing Data

- Edit or delete subjects and time slots using the buttons in each item
- Clear all data using the "Clear All Data" button in the header

## Technical Details

### Technologies Used

- React with TypeScript
- IndexedDB for client-side storage (via Dexie.js)
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React icons

### Project Structure

```
src/
├── components/
│   ├── Timetable.tsx
│   ├── Header.tsx
│   └── ui/ (shadcn/ui components)
├── hooks/
│   └── useTimetable.tsx
├── lib/
│   └── db.ts
├── types/
│   └── index.ts
└── utils/
    └── utils.ts
```

### Data Models

- **Subject**: id, name, color
- **TimeSlot**: id, day, startTime, endTime, subjectId (optional), isCombined, combinedSlots (array of slot IDs)

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview the production build

## License

This project is licensed under the MIT License.