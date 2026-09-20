from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database.connection import engine


router = APIRouter(
    prefix="/likes",
    tags=["Likes"]
)


# ============================================================
# LIKE A SONG
# ============================================================

@router.post("/")
def like_song(
    provider: str,
    provider_track_id: str,
    title: str,
    artist: str | None = None,
    cover_url: str | None = None,
    duration_ms: int | None = None
):
    try:
        with engine.begin() as connection:
            # Find the provider track first.
            result = connection.execute(
                text("""
                    SELECT id
                    FROM public.music_tracks
                    WHERE provider = :provider
                    AND provider_track_id = :provider_track_id
                    LIMIT 1
                """),
                {
                    "provider": provider,
                    "provider_track_id": provider_track_id
                }
            )

            track = result.fetchone()

            # Create the track metadata if it doesn't exist yet.
            if track:
                music_track_id = track[0]
            else:
                result = connection.execute(
                    text("""
                        INSERT INTO public.music_tracks
                        (
                            provider,
                            provider_track_id,
                            title,
                            artist,
                            cover_url,
                            duration_ms
                        )
                        VALUES
                        (
                            :provider,
                            :provider_track_id,
                            :title,
                            :artist,
                            :cover_url,
                            :duration_ms
                        )
                        RETURNING id
                    """),
                    {
                        "provider": provider,
                        "provider_track_id": provider_track_id,
                        "title": title,
                        "artist": artist,
                        "cover_url": cover_url,
                        "duration_ms": duration_ms
                    }
                )
                music_track_id = result.fetchone()[0]

            # Because user_id is NULL until authentication is added,
            # check explicitly for an existing anonymous like.
            existing = connection.execute(
                text("""
                    SELECT id
                    FROM public.liked_tracks
                    WHERE user_id IS NULL
                    AND music_track_id = :music_track_id
                    LIMIT 1
                """),
                {"music_track_id": music_track_id}
            ).fetchone()

            if existing:
                return {
                    "status": "success",
                    "liked": True,
                    "already_liked": True,
                    "music_track_id": music_track_id,
                    "like_id": existing[0]
                }

            result = connection.execute(
                text("""
                    INSERT INTO public.liked_tracks
                    (
                        user_id,
                        music_track_id
                    )
                    VALUES
                    (
                        NULL,
                        :music_track_id
                    )
                    RETURNING id
                """),
                {"music_track_id": music_track_id}
            )

            like = result.fetchone()

        return {
            "status": "success",
            "liked": True,
            "already_liked": False,
            "music_track_id": music_track_id,
            "like_id": like[0]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# UNLIKE A SONG
# ============================================================

@router.delete("/{music_track_id}")
def unlike_song(music_track_id: int):
    try:
        with engine.begin() as connection:
            result = connection.execute(
                text("""
                    DELETE FROM public.liked_tracks
                    WHERE user_id IS NULL
                    AND music_track_id = :music_track_id
                    RETURNING id
                """),
                {"music_track_id": music_track_id}
            )

            deleted = result.fetchone()

        return {
            "status": "success",
            "liked": False,
            "music_track_id": music_track_id,
            "removed": deleted is not None
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# GET LIKED SONGS
# ============================================================

@router.get("/")
def get_liked_songs():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("""
                    SELECT
                        lt.id AS like_id,
                        lt.liked_at,
                        mt.id AS music_track_id,
                        mt.provider,
                        mt.provider_track_id,
                        mt.title,
                        mt.artist,
                        mt.cover_url,
                        mt.duration_ms
                    FROM public.liked_tracks lt
                    JOIN public.music_tracks mt
                        ON mt.id = lt.music_track_id
                    WHERE lt.user_id IS NULL
                    ORDER BY lt.liked_at DESC
                """)
            )

            rows = result.mappings().all()

        return {
            "status": "success",
            "count": len(rows),
            "songs": [dict(row) for row in rows]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
