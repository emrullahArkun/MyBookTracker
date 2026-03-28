export type GenreStat = {
    genre: string;
    count: number;
};

export type DailyActivity = {
    date: string;
    pagesRead: number;
};

export type ReadingTimeOfDay = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT' | 'UNKNOWN';

export type ReadingSessionLength = 'SHORT' | 'MEDIUM' | 'LONG' | 'UNKNOWN';

export type ReadingRhythm = {
    enoughData: boolean;
    preferredTimeOfDay: ReadingTimeOfDay;
    preferredSessionLength: ReadingSessionLength;
    activeDaysLast14: number;
    sessionsLast14: number;
    averagePagesPerSession: number;
    averageMinutesPerSession: number;
};

export type StatsOverview = {
    totalBooks: number;
    completedBooks: number;
    totalPagesRead: number;
    totalReadingMinutes: number;
    currentStreak: number;
    longestStreak: number;
    genreDistribution: GenreStat[];
    dailyActivity: DailyActivity[];
    readingRhythm: ReadingRhythm | null;
};

export type Achievement = {
    id: string;
    unlocked: boolean;
    unlockedDetail: string | null;
};

export type Streak = {
    currentStreak: number;
    longestStreak: number;
};
