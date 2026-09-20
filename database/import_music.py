import os
import ast
import math
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
from dotenv import load_dotenv


# ============================================================
# CONFIG
# ============================================================

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL not found. Add it to your .env file."
    )

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

TRACK_FILE = os.path.join(DATA_DIR, "data.csv")
ARTIST_GENRE_FILE = os.path.join(DATA_DIR, "data_w_genres.csv")

BATCH_SIZE = 1000


# ============================================================
# HELPERS
# ============================================================

def clean_value(value):
    """
    Convert pandas NaN values to None.
    """
    if pd.isna(value):
        return None
    return value


def parse_artists(value):
    """
    Dataset artists column can look like:

    ['The Weeknd']
    ['Drake', 'Future']

    Returns a Python list.
    """

    if pd.isna(value):
        return []

    value = str(value).strip()

    try:
        parsed = ast.literal_eval(value)

        if isinstance(parsed, list):
            return [str(x).strip() for x in parsed]

    except Exception:
        pass

    # Fallback
    return [value]


def normalize_artist_name(name):
    return str(name).strip()


# ============================================================
# LOAD DATA
# ============================================================

print("\n🎵 MUSIC DATABASE IMPORTER")
print("=" * 60)

print("\n📂 Loading track dataset...")

if not os.path.exists(TRACK_FILE):
    raise FileNotFoundError(
        f"Could not find:\n{TRACK_FILE}\n\n"
        "Put data.csv inside database/data/"
    )

tracks = pd.read_csv(TRACK_FILE)

print(f"✅ Tracks loaded: {len(tracks):,}")

print("\n📂 Loading artist/genre dataset...")

artist_genres = {}

if os.path.exists(ARTIST_GENRE_FILE):

    genre_df = pd.read_csv(ARTIST_GENRE_FILE)

    print(f"✅ Artist records loaded: {len(genre_df):,}")

    for _, row in genre_df.iterrows():

        artist = normalize_artist_name(row["artists"])

        genres = row.get("genres", "")

        if pd.isna(genres):
            genres = ""

        artist_genres[artist] = str(genres)

else:

    print("⚠️ data_w_genres.csv not found.")
    print("Continuing without genre information.")


# ============================================================
# CHECK REQUIRED COLUMNS
# ============================================================

required_columns = [
    "id",
    "name",
    "artists",
    "year",
    "duration_ms",
    "popularity",
    "danceability",
    "energy",
    "loudness",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo",
    "explicit",
]

missing_columns = [
    column
    for column in required_columns
    if column not in tracks.columns
]

if missing_columns:

    print("\n❌ Missing columns:")

    for column in missing_columns:
        print(f"   - {column}")

    print("\nAvailable columns:")

    for column in tracks.columns:
        print(f"   - {column}")

    raise ValueError("Dataset columns do not match expected structure.")


print("\n✅ Dataset columns verified.")


# ============================================================
# CONNECT DATABASE
# ============================================================

print("\n🔌 Connecting to PostgreSQL...")

connection = psycopg2.connect(DATABASE_URL)

connection.autocommit = False

cursor = connection.cursor()

print("✅ Database connected.")


# ============================================================
# COLLECT UNIQUE ARTISTS
# ============================================================

print("\n🎤 Preparing artists...")

unique_artists = set()

for artists_value in tracks["artists"]:

    artists = parse_artists(artists_value)

    for artist in artists:

        if artist:
            unique_artists.add(
                normalize_artist_name(artist)
            )


unique_artists = sorted(unique_artists)

print(
    f"🎤 Unique artists found: "
    f"{len(unique_artists):,}"
)


# ============================================================
# INSERT ARTISTS
# ============================================================

print("\n💾 Inserting artists...")

artist_insert_query = """
    INSERT INTO artists (name)
    VALUES %s
    ON CONFLICT DO NOTHING
"""

artist_values = [
    (artist,)
    for artist in unique_artists
]

for start in range(0, len(artist_values), BATCH_SIZE):

    batch = artist_values[
        start:start + BATCH_SIZE
    ]

    execute_values(
        cursor,
        artist_insert_query,
        batch
    )

    connection.commit()

    progress = min(
        start + BATCH_SIZE,
        len(artist_values)
    )

    print(
        f"   Artists: "
        f"{progress:,}/{len(artist_values):,}"
    )


# ============================================================
# LOAD ARTIST IDS
# ============================================================

print("\n🔎 Loading artist IDs...")

cursor.execute("""
    SELECT id, name
    FROM artists
""")

artist_id_map = {
    name: artist_id
    for artist_id, name in cursor.fetchall()
}

print(
    f"✅ Artist IDs loaded: "
    f"{len(artist_id_map):,}"
)


# ============================================================
# PREPARE SONGS
# ============================================================

print("\n🎵 Preparing songs...")

song_values = []

for _, row in tracks.iterrows():

    artists = parse_artists(row["artists"])

    if not artists:
        continue

    # Our current schema supports one primary artist.
    primary_artist = normalize_artist_name(
        artists[0]
    )

    artist_id = artist_id_map.get(primary_artist)

    if artist_id is None:
        continue

    genre = artist_genres.get(
        primary_artist,
        None
    )

    song_values.append(
        (
            clean_value(row["id"]),
            clean_value(row["name"]),
            artist_id,
            None,  # album_id - dataset doesn't reliably provide album
            genre,
            clean_value(row["year"]),
            clean_value(row["duration_ms"]),
            clean_value(row["popularity"]),
            clean_value(row["danceability"]),
            clean_value(row["energy"]),
            clean_value(row["loudness"]),
            clean_value(row["speechiness"]),
            clean_value(row["acousticness"]),
            clean_value(row["instrumentalness"]),
            clean_value(row["liveness"]),
            clean_value(row["valence"]),
            clean_value(row["tempo"]),
            bool(row["explicit"])
        )
    )


print(
    f"🎵 Songs prepared: "
    f"{len(song_values):,}"
)


# ============================================================
# INSERT SONGS
# ============================================================

print("\n💾 Importing songs...")
print("=" * 60)

song_insert_query = """
    INSERT INTO songs (
        external_id,
        title,
        artist_id,
        album_id,
        genre,
        release_year,
        duration_ms,
        popularity,
        danceability,
        energy,
        loudness,
        speechiness,
        acousticness,
        instrumentalness,
        liveness,
        valence,
        tempo,
        explicit
    )
    VALUES %s

    ON CONFLICT (external_id)
    DO UPDATE SET

        title = EXCLUDED.title,
        artist_id = EXCLUDED.artist_id,
        genre = EXCLUDED.genre,
        release_year = EXCLUDED.release_year,
        duration_ms = EXCLUDED.duration_ms,
        popularity = EXCLUDED.popularity,
        danceability = EXCLUDED.danceability,
        energy = EXCLUDED.energy,
        loudness = EXCLUDED.loudness,
        speechiness = EXCLUDED.speechiness,
        acousticness = EXCLUDED.acousticness,
        instrumentalness = EXCLUDED.instrumentalness,
        liveness = EXCLUDED.liveness,
        valence = EXCLUDED.valence,
        tempo = EXCLUDED.tempo,
        explicit = EXCLUDED.explicit
"""


total_songs = len(song_values)

number_of_batches = math.ceil(
    total_songs / BATCH_SIZE
)

for batch_number, start in enumerate(
    range(0, total_songs, BATCH_SIZE),
    start=1
):

    batch = song_values[
        start:start + BATCH_SIZE
    ]

    execute_values(
        cursor,
        song_insert_query,
        batch
    )

    connection.commit()

    imported = min(
        start + BATCH_SIZE,
        total_songs
    )

    percentage = (
        imported / total_songs
    ) * 100

    print(
        f"   [{percentage:6.2f}%] "
        f"{imported:,}/{total_songs:,} songs"
    )


# ============================================================
# VERIFY
# ============================================================

print("\n🔍 Verifying database...")

cursor.execute(
    "SELECT COUNT(*) FROM artists"
)

artist_count = cursor.fetchone()[0]

cursor.execute(
    "SELECT COUNT(*) FROM songs"
)

song_count = cursor.fetchone()[0]


# ============================================================
# CLOSE
# ============================================================

cursor.close()
connection.close()


# ============================================================
# SUCCESS
# ============================================================

print("\n" + "=" * 60)

print("🎉 IMPORT COMPLETED SUCCESSFULLY!")

print("=" * 60)

print(
    f"🎤 Artists in database : {artist_count:,}"
)

print(
    f"🎵 Songs in database   : {song_count:,}"
)

print("\n🚀 Database music catalog is ready!")