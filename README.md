# 🕷️ Music Spider

A full-stack music streaming and recommendation platform that lets users search, discover, stream, like, and manage music using the Audius API, with a machine-learning recommendation system planned for personalized recommendations.

---

## 🎵 Features

### 🔎 Music Search
- Search for songs, artists, and genres
- Real-time music results through the Audius API
- Artwork and artist information
- Hindi and other genre-based discovery

### 🎧 Music Streaming
- Stream music directly through Audius
- Play / Pause
- Previous / Next
- Shuffle
- Repeat
- Volume control
- Seek/progress control
- Queue management

### ❤️ Liked Songs
- Like songs
- Unlike songs
- View liked songs
- Store user music preferences in the database

### 🕘 Listening History
- Track recently played music
- Store listening activity
- Keep audio files external — Music Spider does not store song files

### 🤖 Music Recommendation System
The project includes a machine-learning recommendation component designed to recommend songs based on audio features and user preferences.

The ML pipeline uses features such as:

- Danceability
- Energy
- Loudness
- Speechiness
- Acousticness
- Instrumentalness
- Liveness
- Valence
- Tempo
- Duration
- Popularity

The recommendation model uses **K-Nearest Neighbors (KNN)** with cosine similarity.

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │     Music Spider    │
                    │      Frontend       │
                    │    React + Vite     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │       Backend       │
                    └──────┬─────────┬────┘
                           │         │
              ┌────────────┘         └─────────────┐
              ▼                                    ▼
     ┌─────────────────┐                  ┌─────────────────┐
     │    Supabase     │                  │    Audius API   │
     │    Database     │                  │ Music / Stream  │
     └─────────────────┘                  └─────────────────┘
              │
              ▼
     ┌─────────────────┐
     │  Recommendation │
     │    ML Model     │
     │      KNN        │
     └─────────────────┘
