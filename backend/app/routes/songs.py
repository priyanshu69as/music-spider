from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Song


router = APIRouter(
    prefix="/songs",
    tags=["Songs"]
)


# -------------------------
# GET ALL SONGS
# -------------------------

@router.get("/")
def get_songs(
    skip: int = 0,
    limit: int = Query(default=20, le=100),
    db: Session = Depends(get_db)
):
    songs = (
        db.query(Song)
        .offset(skip)
        .limit(limit)
        .all()
    )

    return songs


# -------------------------
# SEARCH SONGS
# -------------------------

@router.get("/search/")
def search_songs(
    q: str,
    db: Session = Depends(get_db)
):
    songs = (
        db.query(Song)
        .filter(Song.title.ilike(f"%{q}%"))
        .limit(20)
        .all()
    )

    return songs


# -------------------------
# GET SINGLE SONG
# -------------------------

@router.get("/{song_id}")
def get_song(
    song_id: int,
    db: Session = Depends(get_db)
):

    song = db.query(Song).filter(
        Song.id == song_id
    ).first()

    if not song:
        raise HTTPException(
            status_code=404,
            detail="Song not found"
        )

    return song