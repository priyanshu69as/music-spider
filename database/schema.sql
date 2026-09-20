-- ============================================================
-- 🎵 MUSIC RECOMMENDATION SYSTEM
-- DATABASE SCHEMA
-- PostgreSQL / Supabase
-- ============================================================


-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) UNIQUE NOT NULL,

    avatar_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 2. ARTISTS
-- ============================================================

CREATE TABLE artists (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    image_url TEXT,

    bio TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 3. ALBUMS
-- ============================================================

CREATE TABLE albums (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    artist_id BIGINT REFERENCES artists(id)
        ON DELETE SET NULL,

    cover_url TEXT,

    release_year INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 4. SONGS
-- ============================================================

CREATE TABLE songs (
    id BIGSERIAL PRIMARY KEY,

    -- Original dataset / API ID
    external_id VARCHAR(255) UNIQUE,

    title VARCHAR(255) NOT NULL,

    artist_id BIGINT REFERENCES artists(id)
        ON DELETE SET NULL,

    album_id BIGINT REFERENCES albums(id)
        ON DELETE SET NULL,

    genre VARCHAR(255),

    release_year INTEGER,

    duration_ms INTEGER,

    popularity REAL,

    -- Audio features used by ML
    danceability REAL,

    energy REAL,

    loudness REAL,

    speechiness REAL,

    acousticness REAL,

    instrumentalness REAL,

    liveness REAL,

    valence REAL,

    tempo REAL,

    explicit BOOLEAN DEFAULT FALSE,

    -- Playback / artwork
    audio_url TEXT,

    cover_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 5. LIKED SONGS
-- ============================================================

CREATE TABLE likes (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    song_id BIGINT NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate likes
    UNIQUE(user_id, song_id)
);


-- ============================================================
-- 6. LISTENING HISTORY
-- ============================================================

CREATE TABLE listening_history (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    song_id BIGINT NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,

    played_at TIMESTAMPTZ DEFAULT NOW(),

    -- How long the user actually listened
    duration_played_ms INTEGER DEFAULT 0,

    -- Did the song reach the end?
    completed BOOLEAN DEFAULT FALSE,

    -- Did the user skip the song?
    skipped BOOLEAN DEFAULT FALSE
);


-- ============================================================
-- 7. PLAYLISTS
-- ============================================================

CREATE TABLE playlists (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,

    description TEXT,

    cover_url TEXT,

    is_public BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 8. PLAYLIST SONGS
-- ============================================================

CREATE TABLE playlist_songs (
    id BIGSERIAL PRIMARY KEY,

    playlist_id BIGINT NOT NULL
        REFERENCES playlists(id)
        ON DELETE CASCADE,

    song_id BIGINT NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,

    position INTEGER,

    added_at TIMESTAMPTZ DEFAULT NOW(),

    -- Same song can only appear once
    UNIQUE(playlist_id, song_id)
);


-- ============================================================
-- 9. USER PREFERENCES
-- ============================================================

CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID UNIQUE NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    favorite_genres TEXT[],

    favorite_artists TEXT[],

    preferred_language VARCHAR(50),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 10. SEARCH HISTORY
-- ============================================================

CREATE TABLE search_history (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    search_query TEXT NOT NULL,

    searched_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 11. RECENTLY PLAYED
-- ============================================================

CREATE TABLE recently_played (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    song_id BIGINT NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,

    played_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- 12. RECOMMENDATION HISTORY
-- ============================================================

CREATE TABLE recommendation_history (
    id BIGSERIAL PRIMARY KEY,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    song_id BIGINT NOT NULL
        REFERENCES songs(id)
        ON DELETE CASCADE,

    recommendation_score REAL,

    recommendation_source VARCHAR(100),

    recommended_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Songs
CREATE INDEX idx_songs_title
ON songs(title);

CREATE INDEX idx_songs_artist
ON songs(artist_id);

CREATE INDEX idx_songs_genre
ON songs(genre);

CREATE INDEX idx_songs_popularity
ON songs(popularity);


-- Listening history
CREATE INDEX idx_history_user
ON listening_history(user_id);

CREATE INDEX idx_history_song
ON listening_history(song_id);

CREATE INDEX idx_history_played_at
ON listening_history(played_at);


-- Likes
CREATE INDEX idx_likes_user
ON likes(user_id);

CREATE INDEX idx_likes_song
ON likes(song_id);


-- Playlists
CREATE INDEX idx_playlists_user
ON playlists(user_id);


-- Playlist songs
CREATE INDEX idx_playlist_songs_playlist
ON playlist_songs(playlist_id);


-- Search history
CREATE INDEX idx_search_user
ON search_history(user_id);


-- Recommendation history
CREATE INDEX idx_recommendation_user
ON recommendation_history(user_id);


-- ============================================================
-- DONE
-- ============================================================

-- Database structure created successfully.