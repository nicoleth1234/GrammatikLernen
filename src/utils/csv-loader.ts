export async function ladeCsvDatei(pfad: string): Promise<string[][]> {
    const response = await fetch(pfad);
    const text = await response.text();
    return text.trim().split("\n").map(zeile => zeile.split(","));
}