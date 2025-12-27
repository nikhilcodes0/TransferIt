type cleanTitle = {
    artist: string | null;
    track: string;
    raw: string;
}

const NOISEWORDS = [
    "official video",
    "official music video",
    "lyrics",
    "lyric video",
    "audio",
    "hd",
    "4k",
    "video song",
    "full song",

];

export function cleanSongTitle(title: string): cleanTitle {

    let clean = title.toLowerCase();

    clean = clean.replace(/\([^)]*\)/g, "");
    clean = clean.replace(/\[[^\]]*\]/g, "");


    for (const word of NOISEWORDS) {
        clean = clean.replace(word, "");
    }

    clean = clean.replace(/\|/g, "");
    clean = clean.replace(/"/g, "");
    clean = clean.trim();

    const parts = clean.split(" - ").map((p) => p.trim());

    if (parts.length >= 2) {
        return {
            artist: capitalize(parts[0]),
            track: capitalize(parts[1]),
            raw: title,
        };
    }
    return {
        artist: null,
        track: capitalize(clean),
        raw: title,
    };


}

function capitalize(text: string) {
    return text
        .split(" ")
        .filter(Boolean)
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(" ");
}