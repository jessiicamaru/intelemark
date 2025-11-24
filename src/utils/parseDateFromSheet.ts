export function parseGoogleDate(dateStr: string): string {
    const match = dateStr.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);

    const [_, y, m, d, h, min, s] = match.map(Number);
    const date = new Date(y, m, d, h, min, s);
    return date.toLocaleString('vi-VN', {
        dateStyle: 'short',
        timeStyle: 'short',
    });
}
