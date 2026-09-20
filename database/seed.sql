-- ============================================================
-- 🎵 MUSIC RECOMMENDATION SYSTEM
-- DEMO SEED DATA
-- ============================================================


-- ============================================================
-- 1. DEMO USER
-- ============================================================

INSERT INTO users (
    id,
    name,
    email,
    avatar_url
)
VALUES (
    gen_random_uuid(),
    'Demo User',
    'demo@musicapp.local',
    NULL
)
ON CONFLICT (email) DO NOTHING;


-- ============================================================
-- 2. ARTISTS
-- ============================================================

INSERT INTO artists (name)
VALUES
    ('The Weeknd'),
    ('Ed Sheeran'),
    ('Imagine Dragons'),
    ('Dua Lipa'),
    ('Adele')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 3. ALBUMS
-- ============================================================

INSERT INTO albums (
    title,
    artist_id,
    release_year
)
SELECT
    'After Hours',
    id,
    2020
FROM artists
WHERE name = 'The Weeknd'
AND NOT EXISTS (
    SELECT 1
    FROM albums
    WHERE title = 'After Hours'
);


INSERT INTO albums (
    title,
    artist_id,
    release_year
)
SELECT
    'Divide',
    id,
    2017
FROM artists
WHERE name = 'Ed Sheeran'
AND NOT EXISTS (
    SELECT 1
    FROM albums
    WHERE title = 'Divide'
);


INSERT INTO albums (
    title,
    artist_id,
    release_year
)
SELECT
    'Evolve',
    id,
    2017
FROM artists
WHERE name = 'Imagine Dragons'
AND NOT EXISTS (
    SELECT 1
    FROM albums
    WHERE title = 'Evolve'
);


-- ============================================================
-- 4. SONGS
-- ============================================================

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
SELECT
    'demo_blinding_lights',
    'Blinding Lights',
    a.id,
    al.id,
    'Pop',
    2020,
    200040,
    95,
    0.514,
    0.730,
    -5.934,
    0.0598,
    0.00146,
    0.000095,
    0.0897,
    0.334,
    171.005,
    FALSE
FROM artists a
JOIN albums al
    ON al.artist_id = a.id
WHERE a.name = 'The Weeknd'
AND al.title = 'After Hours'
AND NOT EXISTS (
    SELECT 1
    FROM songs
    WHERE external_id = 'demo_blinding_lights'
);


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
SELECT
    'demo_shape_of_you',
    'Shape of You',
    a.id,
    al.id,
    'Pop',
    2017,
    233713,
    94,
    0.825,
    0.652,
    -3.183,
    0.0802,
    0.581,
    0.000000,
    0.0931,
    0.931,
    95.977,
    FALSE
FROM artists a
JOIN albums al
    ON al.artist_id = a.id
WHERE a.name = 'Ed Sheeran'
AND al.title = 'Divide'
AND NOT EXISTS (
    SELECT 1
    FROM songs
    WHERE external_id = 'demo_shape_of_you'
);


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
SELECT
    'demo_believer',
    'Believer',
    a.id,
    al.id,
    'Rock',
    2017,
    204346,
    93,
    0.776,
    0.780,
    -4.374,
    0.128,
    0.0622,
    0.000000,
    0.0810,
    0.666,
    124.949,
    FALSE
FROM artists a
JOIN albums al
    ON al.artist_id = a.id
WHERE a.name = 'Imagine Dragons'
AND al.title = 'Evolve'
AND NOT EXISTS (
    SELECT 1
    FROM songs
    WHERE external_id = 'demo_believer'
);


-- ============================================================
-- 5. LIKE SOME SONGS
-- ============================================================

INSERT INTO likes (
    user_id,
    song_id
)
SELECT
    u.id,
    s.id
FROM users u
CROSS JOIN songs s
WHERE u.email = 'demo@musicapp.local'
AND s.external_id IN (
    'demo_blinding_lights',
    'demo_shape_of_you'
)
ON CONFLICT (user_id, song_id) DO NOTHING;


-- ============================================================
-- 6. CREATE DEMO PLAYLIST
-- ============================================================

INSERT INTO playlists (
    user_id,
    name,
    description,
    is_public
)
SELECT
    id,
    'My Favorites',
    'Demo playlist created during database testing.',
    FALSE
FROM users
WHERE email = 'demo@musicapp.local'
AND NOT EXISTS (
    SELECT 1
    FROM playlists
    WHERE user_id = users.id
    AND name = 'My Favorites'
);


-- ============================================================
-- 7. ADD SONGS TO PLAYLIST
-- ============================================================

INSERT INTO playlist_songs (
    playlist_id,
    song_id,
    position
)
SELECT
    p.id,
    s.id,
    CASE
        WHEN s.external_id = 'demo_blinding_lights' THEN 1
        WHEN s.external_id = 'demo_shape_of_you' THEN 2
        WHEN s.external_id = 'demo_believer' THEN 3
    END
FROM playlists p
JOIN users u
    ON p.user_id = u.id
CROSS JOIN songs s
WHERE u.email = 'demo@musicapp.local'
AND p.name = 'My Favorites'
AND s.external_id IN (
    'demo_blinding_lights',
    'demo_shape_of_you',
    'demo_believer'
)
ON CONFLICT (playlist_id, song_id) DO NOTHING;


-- ============================================================
-- 8. DEMO LISTENING HISTORY
-- ============================================================

INSERT INTO listening_history (
    user_id,
    song_id,
    duration_played_ms,
    completed,
    skipped
)
SELECT
    u.id,
    s.id,
    CASE
        WHEN s.external_id = 'demo_blinding_lights' THEN 200040
        WHEN s.external_id = 'demo_shape_of_you' THEN 233713
        ELSE 85000
    END,
    CASE
        WHEN s.external_id IN (
            'demo_blinding_lights',
            'demo_shape_of_you'
        )
        THEN TRUE
        ELSE FALSE
    END,
    CASE
        WHEN s.external_id = 'demo_believer'
        THEN TRUE
        ELSE FALSE
    END
FROM users u
CROSS JOIN songs s
WHERE u.email = 'demo@musicapp.local'
AND s.external_id IN (
    'demo_blinding_lights',
    'demo_shape_of_you',
    'demo_believer'
);


-- ============================================================
-- 9. USER PREFERENCES
-- ============================================================

INSERT INTO user_preferences (
    user_id,
    favorite_genres,
    favorite_artists,
    preferred_language
)
SELECT
    id,
    ARRAY['Pop', 'Rock'],
    ARRAY['The Weeknd', 'Ed Sheeran'],
    'English'
FROM users
WHERE email = 'demo@musicapp.local'
ON CONFLICT (user_id)
DO UPDATE SET
    favorite_genres = EXCLUDED.favorite_genres,
    favorite_artists = EXCLUDED.favorite_artists,
    preferred_language = EXCLUDED.preferred_language,
    updated_at = NOW();


-- ============================================================
-- ✅ SEED COMPLETE
-- ============================================================

SELECT
    'Seed completed successfully!' AS status;