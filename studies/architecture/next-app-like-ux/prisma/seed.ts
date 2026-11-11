import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.");

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

export const DEMO_USER_ID = "demo-user";

// Every artist and title here is invented. The audio is synthesized in the
// browser from `seed`, so there are no real recordings anywhere in the app.
const CATALOG: Array<{ artist: string; genre: string; bpm: number; titles: string[] }> = [
  {
    artist: "Mira Oyelaran",
    genre: "Ambient",
    bpm: 72,
    titles: ["Glass Harbor", "Low Tide Radio", "Salt on the Window", "A Slower Weather"],
  },
  {
    artist: "Kiln & Co.",
    genre: "House",
    bpm: 122,
    titles: ["Warm Brick", "Second Floor Lights", "Paper Tickets", "Open Late", "Corner Table"],
  },
  {
    artist: "Tobias Vennholm",
    genre: "Lo-fi",
    bpm: 84,
    titles: ["Borrowed Sweater", "Rain Check", "Tape Hiss Sunday", "Kettle On"],
  },
  {
    artist: "Neon Orchard",
    genre: "Synthwave",
    bpm: 104,
    titles: ["Night Bus North", "Chrome Peaches", "Arcade Closing Time", "Signal Flare", "Velvet Static"],
  },
  {
    artist: "The Ferry Quartet",
    genre: "Jazz-hop",
    bpm: 92,
    titles: ["Blue Line Shuffle", "Half a Lemon", "Upstairs Piano", "Slow Elevator"],
  },
  {
    artist: "Aiko Brandt",
    genre: "Techno",
    bpm: 130,
    titles: ["Concrete Garden", "Fuse Box", "Four Walls Moving", "Strobe Patience"],
  },
  {
    artist: "Small Hours Club",
    genre: "Lo-fi",
    bpm: 78,
    titles: ["Last Tram", "Porch Light", "Unsent Letter", "Soft Alarm"],
  },
  {
    artist: "Juniper Sato",
    genre: "Ambient",
    bpm: 66,
    titles: ["Moss Clock", "Field of Antennas", "Breathing Room"],
  },
  {
    artist: "Halden Vale",
    genre: "House",
    bpm: 118,
    titles: ["Marble Steps", "Sunday Sequencer", "Good Company"],
  },
];

const PLAYLISTS: Array<{
  id: string;
  name: string;
  description: string;
  locked?: boolean;
  genres: string[];
  take: number;
}> = [
  {
    id: "desk-hours",
    name: "Desk Hours",
    description: "Steady and unhurried, for getting through a long list.",
    genres: ["Lo-fi", "Jazz-hop"],
    take: 8,
  },
  {
    id: "after-dark",
    name: "After Dark",
    description: "Neon, motorways and whatever is still open.",
    genres: ["Synthwave", "Techno"],
    take: 7,
  },
  {
    id: "open-windows",
    name: "Open Windows",
    description: "Slow air for a room that needs it.",
    genres: ["Ambient"],
    take: 6,
  },
  {
    id: "kitchen-floor",
    name: "Kitchen Floor",
    description: "Four on the floor while something simmers.",
    genres: ["House"],
    take: 7,
  },
  {
    id: "staff-picks",
    name: "Staff Picks",
    description: "Curated by the house. Locked — try changing it and watch the rollback.",
    locked: true,
    genres: ["House", "Synthwave", "Jazz-hop", "Ambient"],
    take: 6,
  },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Small deterministic hash so re-seeding always produces the same catalog.
function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function main() {
  await prisma.favorite.deleteMany();
  await prisma.playlistTrack.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.track.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({ data: { id: DEMO_USER_ID, name: "Demo Listener" } });

  // Interleave artists so the library doesn't read as nine solid blocks.
  const flat = CATALOG.flatMap((entry) =>
    entry.titles.map((title, i) => ({ ...entry, title, order: i })),
  ).sort((a, b) => a.order - b.order || hash(a.title) - hash(b.title));

  const baseDate = new Date("2026-09-01T09:00:00Z").getTime();
  const tracks = flat.map((entry, position) => {
    const seed = hash(entry.title);
    return {
      id: slugify(entry.title),
      title: entry.title,
      artist: entry.artist,
      genre: entry.genre,
      bpm: entry.bpm + (seed % 7) - 3,
      durationSec: 96 + (seed % 90),
      seed,
      position,
      createdAt: new Date(baseDate + position * 36 * 60 * 60 * 1000),
    };
  });
  await prisma.track.createMany({ data: tracks });

  for (const playlist of PLAYLISTS) {
    const picks = tracks
      .filter((track) => playlist.genres.includes(track.genre))
      .sort((a, b) => hash(a.id + playlist.id) - hash(b.id + playlist.id))
      .slice(0, playlist.take);

    await prisma.playlist.create({
      data: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        locked: playlist.locked ?? false,
        seed: hash(playlist.id),
        ownerId: DEMO_USER_ID,
        tracks: {
          create: picks.map((track, position) => ({ trackId: track.id, position })),
        },
      },
    });
  }

  const favorites = ["glass-harbor", "warm-brick", "night-bus-north", "half-a-lemon", "porch-light"];
  await prisma.favorite.createMany({
    data: favorites.map((trackId, i) => ({
      userId: DEMO_USER_ID,
      trackId,
      createdAt: new Date(baseDate + i * 60 * 1000),
    })),
  });

  console.log(`Seeded ${tracks.length} tracks, ${PLAYLISTS.length} playlists, ${favorites.length} favorites.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
