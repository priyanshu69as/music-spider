const API_BASE_URL = "http://localhost:8000";

export async function searchMusic(query) {
  const url =
    `${API_BASE_URL}/music/search?q=${encodeURIComponent(query)}&limit=10`;

  console.log("Searching:", url);

  const response = await fetch(url);

  console.log("Backend response:", response.status);

  if (!response.ok) {
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();

  console.log("Audius results:", data);

  return data;
}

export function getStreamUrl(trackId) {
  return `${API_BASE_URL}/music/stream/${trackId}`;
}

export async function saveListeningHistory(song) {
  if (!song) {
    return;
  }

  const trackId = song.track_id || song.id;

  if (!trackId) {
    console.warn("Cannot save history: missing Audius track ID");
    return;
  }

  const artwork =
    song.cover_photo ||
    song.user?.profile_picture?.["480x480"] ||
    song.user?.profile_picture?.["150x150"] ||
    null;

  const artist =
    song.user?.name || "Unknown Artist";

  const durationMs =
    song.duration
      ? Math.round(song.duration * 1000)
      : null;

  const response = await fetch(
    `${API_BASE_URL}/history/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: null,
        provider: "audius",
        provider_track_id: String(trackId),
        title: song.title || "Unknown Song",
        artist: artist,
        cover_url: artwork,
        duration_ms: durationMs,
        duration_played_ms: 0,
        completed: false,
        skipped: false,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `History API failed: ${response.status} ${errorText}`
    );
  }

  return response.json();
}


export async function likeSong(song) {
  const trackId = song?.track_id || song?.id;

  if (!trackId) {
    throw new Error("Cannot like song: missing Audius track ID");
  }

  const artwork =
    song.cover_photo ||
    song.user?.profile_picture?.["480x480"] ||
    song.user?.profile_picture?.["150x150"] ||
    null;

  const artist = song.user?.name || "Unknown Artist";

  const durationMs = song.duration
    ? Math.round(song.duration * 1000)
    : null;

  const params = new URLSearchParams({
    provider: "audius",
    provider_track_id: String(trackId),
    title: song.title || "Unknown Song",
    artist,
  });

  if (artwork) params.set("cover_url", artwork);
  if (durationMs !== null) params.set("duration_ms", String(durationMs));

  const response = await fetch(
    `${API_BASE_URL}/likes/?${params.toString()}`,
    { method: "POST" }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Like API failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function unlikeSong(musicTrackId) {
  const response = await fetch(
    `${API_BASE_URL}/likes/${musicTrackId}`,
    { method: "DELETE" }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Unlike API failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function getLikedSongs() {
  const response = await fetch(`${API_BASE_URL}/likes/`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Liked songs API failed: ${response.status} ${errorText}`);
  }

  return response.json();
}
