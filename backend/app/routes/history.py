from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from app.database.connection import engine


router = APIRouter(
    prefix="/history",
    tags=["Listening History"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class HistoryRequest(BaseModel):
    user_id: str | None = None

    provider: str
    provider_track_id: str

    title: str
    artist: str | None = None

    cover_url: str | None = None

    duration_ms: int | None = None

    duration_played_ms: int = 0

    completed: bool = False

    skipped: bool = False


# ============================================================
# SAVE LISTENING HISTORY
# ============================================================

@router.post("/")
def add_history(data: HistoryRequest):

    try:

        with engine.begin() as connection:

            # ------------------------------------------------
            # Find existing Audius track
            # ------------------------------------------------

            result = connection.execute(
                text("""
                    SELECT id
                    FROM public.music_tracks
                    WHERE provider = :provider
                    AND provider_track_id = :provider_track_id
                    LIMIT 1
                """),
                {
                    "provider": data.provider,
                    "provider_track_id":
                        data.provider_track_id
                }
            )

            track = result.fetchone()


            # ------------------------------------------------
            # Create track if it doesn't exist
            # ------------------------------------------------

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
                        "provider":
                            data.provider,

                        "provider_track_id":
                            data.provider_track_id,

                        "title":
                            data.title,

                        "artist":
                            data.artist,

                        "cover_url":
                            data.cover_url,

                        "duration_ms":
                            data.duration_ms
                    }
                )

                music_track_id = result.fetchone()[0]


            # ------------------------------------------------
            # Save listening history
            # ------------------------------------------------

            connection.execute(
                text("""
                    INSERT INTO public.listening_history
                    (
                        user_id,
                        music_track_id,
                        duration_played_ms,
                        completed,
                        skipped
                    )
                    VALUES
                    (
                        :user_id,
                        :music_track_id,
                        :duration_played_ms,
                        :completed,
                        :skipped
                    )
                """),
                {
                    "user_id":
                        data.user_id,

                    "music_track_id":
                        music_track_id,

                    "duration_played_ms":
                        data.duration_played_ms,

                    "completed":
                        data.completed,

                    "skipped":
                        data.skipped
                }
            )


        return {
            "status": "success",
            "message": "Listening history saved",
            "music_track_id": music_track_id
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET RECENTLY PLAYED
# ============================================================

@router.get("/")
def get_history(
    limit: int = Query(default=20, ge=1, le=100)
):

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        lh.id,
                        lh.played_at,
                        lh.duration_played_ms,
                        lh.completed,
                        lh.skipped,

                        mt.id AS music_track_id,
                        mt.provider,
                        mt.provider_track_id,
                        mt.title,
                        mt.artist,
                        mt.cover_url,
                        mt.duration_ms

                    FROM public.listening_history lh

                    JOIN public.music_tracks mt
                        ON mt.id = lh.music_track_id

                    ORDER BY lh.played_at DESC

                    LIMIT :limit
                """),
                {
                    "limit": limit
                }
            )

            rows = result.mappings().all()


        return {
            "status": "success",
            "count": len(rows),
            "history": [
                dict(row)
                for row in rows
            ]
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )