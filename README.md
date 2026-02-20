# Chronos - Smart Calendar & Productivity Application

A powerful, full-featured calendar and productivity application built with Next.js, Node.js, and MongoDB. Features smooth animations, real-time updates, and unique productivity tools.

## Features

### Calendar Features
- **Multiple Views**: Day, Week, and Month views with smooth transitions
- **Event Management**: Create, edit, delete, and duplicate events
- **Drag & Drop**: Reschedule events by dragging
- **Recurring Events**: Daily, weekly, monthly, and yearly patterns
- **Color Coding**: Customize event colors
- **Multiple Calendars**: Create and manage multiple calendars
- **Calendar Sharing**: Share calendars with other users

### Task Management
- **Todo Lists**: Create and organize tasks in custom lists
- **Subtasks**: Break down tasks into smaller steps
- **Priority Levels**: Low, Medium, High, and Urgent
- **Due Dates**: Set deadlines with reminders
- **Task to Event**: Convert todos to calendar events
- **Progress Tracking**: Track completion status

### Unique Features (Not in Google Calendar)

#### 1. Focus Mode (Pomodoro Timer)
- Built-in Pomodoro technique timer
- Customizable session lengths (15, 25, 45, 60, 90 min)
- Category-based focus tracking (Deep Work, Creative, Learning, etc.)
- Streak tracking and achievements
- Distraction logging

#### 2. Productivity Analytics
- **Productivity Score**: Daily/weekly scoring based on completed tasks, focus time, and events
- **Time Distribution**: Visual breakdown of time spent by category
- **Activity Heatmap**: Daily activity visualization
- **Peak Hours Analysis**: Discover your most productive hours
- **Trend Analysis**: Track improvement over time

#### 3. Smart Scheduling
- **Free Slot Finder**: Automatically find available time slots
- **Working Hours**: Define and respect your working hours
- **Smart Suggestions**: Get scheduling recommendations

#### 4. Real-time Notifications
- Browser push notifications
- In-app notification center
- Customizable reminder times
- Real-time event updates via WebSocket

## Tech Stack

### Frontend
- Next.js 14 (React Framework)
- TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- Zustand (State Management)
- Socket.io Client (Real-time)
- Recharts (Analytics Charts)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io (Real-time)
- JWT Authentication
- Node-cron (Scheduled Tasks)

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed and running

> **Note:** You do **not** need Node.js or MongoDB installed locally. Everything runs inside Docker containers.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/CHRONOS.git
cd CHRONOS
```

### 2. Start the Application

```bash
docker-compose up --build -d
```

This single command will:
- Pull and start a **MongoDB** container (data persisted in a Docker volume)
- Build and start the **Backend** (Express.js API on port 5000)
- Build and start the **Frontend** (Next.js on port 3000)

### 3. Access the Application

| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:5000/api     |
| MongoDB  | `mongodb://localhost:27017`   |

### 4. View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### 5. Update or Restart the Application

To apply code changes or restart services without removing them:
```bash
docker-compose up -d --build
```

### 6. Stop the Application

```bash
# Stop containers (preserves container state and data)
docker-compose stop

# Stop and REMOVE containers/networks (cleanup)
docker-compose down
```

### Connecting to MongoDB via Compass

Since port `27017` is mapped to your host, you can connect using [MongoDB Compass](https://www.mongodb.com/products/compass) with:

```
mongodb://localhost:27017
```

The database `chronos_calendar` will appear once the backend starts writing data.

> **Important:** The MongoDB data lives inside a Docker volume (`chronos_data`), not on your local filesystem. It is isolated to this project and won't conflict with other MongoDB installations or projects.

## Environment Variables

All environment variables are pre-configured in `docker-compose.yml`. You do **not** need to create `.env` files for Docker usage.

| Variable             | Service  | Default Value                                      |
|----------------------|----------|----------------------------------------------------|
| `PORT`               | Backend  | `5000`                                             |
| `MONGODB_URI`        | Backend  | `mongodb://chronos_mongodb:27017/chronos_calendar` |
| `FRONTEND_URL`       | Backend  | `http://localhost:3000`                             |
| `JWT_SECRET`         | Backend  | `your-super-secret-jwt-key-change-in-production`   |
| `NEXT_PUBLIC_API_URL`| Frontend | `http://localhost:5000/api`                         |

## Project Structure

```
CALENDAR APPLICATION/
├── backend/
│   ├── models/          # MongoDB schemas
│   │   ├── User.js
│   │   ├── Event.js
│   │   ├── Todo.js
│   │   ├── Calendar.js
│   │   ├── Notification.js
│   │   └── FocusSession.js
│   ├── routes/          # API endpoints
│   │   ├── auth.js
│   │   ├── events.js
│   │   ├── todos.js
│   │   ├── calendars.js
│   │   ├── notifications.js
│   │   ├── analytics.js
│   │   └── focus.js
│   ├── middleware/      # Auth middleware
│   ├── services/        # Business logic
│   └── server.js        # Entry point
│
├── frontend/
│   ├── app/             # Next.js pages
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── register/
│   │   ├── calendar/
│   │   ├── todos/
│   │   ├── focus/
│   │   ├── analytics/
│   │   └── settings/
│   ├── components/      # React components
│   │   ├── layout/
│   │   ├── calendar/
│   │   ├── todos/
│   │   └── ui/
│   ├── lib/            # API client
│   ├── store/          # Zustand stores
│   └── types/          # TypeScript types
│
└── package.json        # Root package.json
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/password` - Change password

### Events
- GET `/api/events` - Get events (with date range)
- POST `/api/events` - Create event
- PUT `/api/events/:id` - Update event
- DELETE `/api/events/:id` - Delete event
- GET `/api/events/suggestions/free-slots` - Get free time slots

### Todos
- GET `/api/todos` - Get todos
- POST `/api/todos` - Create todo
- PUT `/api/todos/:id` - Update todo
- DELETE `/api/todos/:id` - Delete todo
- POST `/api/todos/:id/convert-to-event` - Convert to event

### Calendars
- GET `/api/calendars` - Get calendars
- POST `/api/calendars` - Create calendar
- PUT `/api/calendars/:id` - Update calendar
- DELETE `/api/calendars/:id` - Delete calendar

### Focus
- GET `/api/focus/sessions` - Get focus sessions
- POST `/api/focus/sessions` - Start session
- PUT `/api/focus/sessions/:id/complete` - Complete session
- GET `/api/focus/stats` - Get focus statistics

### Analytics
- GET `/api/analytics/overview` - Get analytics overview
- GET `/api/analytics/productivity-score` - Get productivity score
- GET `/api/analytics/time-distribution` - Get time distribution
- GET `/api/analytics/daily-activity` - Get daily activity
- GET `/api/analytics/peak-hours` - Get peak productivity hours

## Screenshots

### Calendar View
- Month, Week, and Day views with event cards
- Drag and drop rescheduling
- Quick event creation

### Todo List
- Task organization with lists
- Priority and due date management
- Subtask tracking

### Focus Mode
- Pomodoro timer with categories
- Session history
- Streak tracking

### Analytics Dashboard
- Productivity score
- Time distribution charts
- Activity heatmap

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

Built with care for productivity enthusiasts.
