from sqlalchemy import Column, BigInteger, String, Integer, Float, Boolean, Text
from app.database.connection import Base


class Song(Base):
    __tablename__ = "songs"

    id = Column(BigInteger, primary_key=True, index=True)
    external_id = Column(String(255), unique=True)
    title = Column(String(255), nullable=False)

    artist_id = Column(BigInteger)
    album_id = Column(BigInteger)

    genre = Column(String(255))
    release_year = Column(Integer)

    duration_ms = Column(Integer)
    popularity = Column(Float)

    danceability = Column(Float)
    energy = Column(Float)
    loudness = Column(Float)
    speechiness = Column(Float)
    acousticness = Column(Float)
    instrumentalness = Column(Float)
    liveness = Column(Float)
    valence = Column(Float)
    tempo = Column(Float)

    explicit = Column(Boolean, default=False)

    audio_url = Column(Text)
    cover_url = Column(Text)