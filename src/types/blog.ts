export type BlogSummary = {
    id: number;
    title: string;
    description: string;
    readingTime: number;
    timestamp: number;
    views?: number;
    reaction?: "up" | "down" | null;
};

export type BlogContent = BlogSummary & {
    content: string;
};