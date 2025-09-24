export function formatDate(unixSeconds: number): string {
    const d = new Date(unixSeconds * 1000);
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function pluralize(count: number, word: string): string {
    return count === 1 ? `${count} ${word}` : `${count} ${word}s`;
}