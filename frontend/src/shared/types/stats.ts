export type GenreStat = {
    genre: string;
    count: number;
};

export type DailyActivity = {
    date: string;
    pagesRead: number;
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
