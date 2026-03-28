# ChapterFlow

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

1. **Start the application**
    ```bash
    docker compose up --build
    ```

2. **Access the services**
    * App: `http://localhost:5173`
    * API: `http://localhost:8080`
# Beta Access Mode

The production stack can run in two frontend access modes via `docker-compose.prod.yml`:

- `FRONTEND_ACCESS_MODE=beta`: Nginx protects the whole site with HTTP Basic Auth and adds `X-Robots-Tag: noindex, nofollow, noarchive`
- `FRONTEND_ACCESS_MODE=live`: Nginx serves the site normally without the beta gate

The backend is no longer published directly in the production compose file, so the Nginx gate cannot be bypassed through port `8080`.

Create your production env file first:

```bash
cp .env.prod.example .env
```

To create beta credentials:

```bash
htpasswd -cB ops/nginx/.htpasswd yourtester
```

Then start the production-like beta stack with:

```bash
FRONTEND_ACCESS_MODE=beta docker compose -f docker-compose.prod.yml up -d --build
```

When you are ready to remove the gate later:

```bash
FRONTEND_ACCESS_MODE=live docker compose -f docker-compose.prod.yml up -d --build
```
