# ReadWick

A full stack web application for tracking your reading journey, from discovering new books to visualizing detailed statistics about your reading habits.

## Features

### Library Management
Search for books via OpenLibrary, add them to your personal library, and track your progress page by page. Manage your collection with bulk actions, reading status updates, and duplicate prevention.

### Reading Sessions
Start timed reading sessions with a live timer, pause and resume as needed, and automatically track pages read. Multi tab detection prevents conflicting sessions across browser tabs.

### Reading Goals
Set weekly or monthly page goals for individual books. Visual progress indicators show how close you are to completing each goal.

### Statistics & Analytics
View detailed insights into your reading habits:
  * Total pages read, reading speed, and time invested
  * Reading heatmap showing daily activity over the past year
  * Genre distribution and weekly pace charts
  * Per book statistics with projected completion dates and session timelines

### Achievements
Unlock 10 badges as you build your reading habits, including milestones for streaks, speed reading, total pages, and session timing.

### Discovery
Get personalized book recommendations based on your favorite authors, genres, and recent searches.

### Internationalization
Full support for English and German with automatic browser language detection.

## Tech Stack

| Layer    | Technologies                          |
|----------|---------------------------------------|
| Frontend | React, Vite, Chakra UI                |
| Backend  | Spring Boot, Spring Security (JWT)    |
| Database | PostgreSQL                            |
| Testing  | Vitest, JUnit                         |
| CI/CD    | GitHub Actions                        |

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js (for local frontend development)
- [Task](https://taskfile.dev/) (optional, for convenience commands)

### Setup

1. **Create a `.env` file** in the project root (see `.env.example`):
    ```bash
    cp .env.example .env
    ```

2. **Install frontend dependencies**:
    ```bash
    cd frontend && npm install
    ```

### Run

**Full stack in Docker:**
```bash
docker compose up --build
```

**Development mode** (Backend in Docker, Frontend locally with hot reload):
```bash
task dev
```

### Access the services

* App: `http://localhost:5173`
* API: `http://localhost:8080`
