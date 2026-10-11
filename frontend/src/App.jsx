import { useEffect, useRef, useState } from "react";



import {

  Home,

  Search,

  Library,

  Heart,

  Clock3,

  ListMusic,

  Plus,

  Play,

  Pause,

  Loader2,

  Volume2,

  VolumeX,

  SkipBack,

  SkipForward,

  Shuffle,

  Repeat,

} from "lucide-react";



import {

  searchMusic,

  searchAllMusic,

  getStreamUrl,

  saveListeningHistory,

  likeSong,

  unlikeSong,

  getLikedSongs,

} from "./services/api";



import "./index.css";



function App() {

  // ============================================================

  // STATE

  // ============================================================



  const [query, setQuery] = useState("");

  const [showAuth, setShowAuth] = useState(false);

  const [authMode, setAuthMode] = useState("login");

  const [songs, setSongs] = useState([]);
  const [youtubeSongs, setYoutubeSongs] = useState([]);
  const [currentYoutubeSong, setCurrentYoutubeSong] = useState(null);

  const [likedSongs, setLikedSongs] = useState([]);

  const [showLikedSongs, setShowLikedSongs] = useState(false);



  const [loading, setLoading] = useState(false);

  const [currentSong, setCurrentSong] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);



  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);



  const [volume, setVolume] = useState(0.8);

  const [isMuted, setIsMuted] = useState(false);



  const [shuffle, setShuffle] = useState(false);

  const [repeat, setRepeat] = useState(false);



  const [isLiked, setIsLiked] = useState(false);



  const audioRef = useRef(null);

  const previousVolumeRef = useRef(0.8);



  // ============================================================

  // HELPERS

  // ============================================================



  const getTrackId = (song) =>

    song?.track_id ?? song?.id ?? song?.provider_track_id ?? null;



  const getArtwork = (song) => {

    if (!song) return null;



    return (

      song.cover_photo ||

      song.cover_url ||

      song.user?.profile_picture?.["480x480"] ||

      song.user?.profile_picture?.["150x150"] ||

      null

    );

  };



  const getArtist = (song) =>

    song?.user?.name ||

    song?.artist ||

    song?.artist_name ||

    "Unknown Artist";



  const formatTime = (seconds) => {

    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";



    const minutes = Math.floor(seconds / 60);

    const remainingSeconds = Math.floor(seconds % 60)

      .toString()

      .padStart(2, "0");



    return `${minutes}:${remainingSeconds}`;

  };



  const isCurrentSong = (song) => {

    const currentId = String(getTrackId(currentSong) ?? "");

    const songId = String(getTrackId(song) ?? "");



    return Boolean(currentId && songId && currentId === songId);

  };



  // ============================================================

  // SEARCH

  // ============================================================



  const handleSearch = async (event) => {
    event?.preventDefault();
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setShowLikedSongs(false);
      return;
    }

    try {
      setLoading(true);
      setShowLikedSongs(false);
      setCurrentYoutubeSong(null);

      const data = await searchAllMusic(cleanQuery);
      const audiusTracks = Array.isArray(data?.audius?.tracks)
        ? data.audius.tracks
        : [];
      const youtubeTracks = Array.isArray(data?.youtube)
        ? data.youtube
        : [];

      setSongs(audiusTracks);
      setYoutubeSongs(youtubeTracks);

      if (data?.errors?.audius) console.error("Audius search error:", data.errors.audius);
      if (data?.errors?.youtube) console.error("YouTube search error:", data.errors.youtube);
    } catch (error) {
      console.error("Music search failed:", error);
      setSongs([]);
      setYoutubeSongs([]);
      alert("Unable to search music. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenreSearch = async (genre) => {
    if (genre === "All") {
      setQuery("");
      setShowLikedSongs(false);
      setSongs([]);
      setYoutubeSongs([]);
      setCurrentYoutubeSong(null);
      return;
    }

    try {
      setLoading(true);
      setShowLikedSongs(false);
      setQuery(genre);
      setCurrentYoutubeSong(null);

      const data = await searchAllMusic(genre);
      setSongs(Array.isArray(data?.audius?.tracks) ? data.audius.tracks : []);
      setYoutubeSongs(Array.isArray(data?.youtube) ? data.youtube : []);

      if (data?.errors?.audius) console.error("Audius genre search error:", data.errors.audius);
      if (data?.errors?.youtube) console.error("YouTube genre search error:", data.errors.youtube);
    } catch (error) {
      console.error("Genre search failed:", error);
      setSongs([]);
      setYoutubeSongs([]);
      alert(`Unable to load ${genre} music.`);
    } finally {
      setLoading(false);
    }
  };

  // LIKED SONGS

  // ============================================================



  const loadLikedSongs = async () => {

    try {

      setLoading(true);



      const data = await getLikedSongs();

      const results = Array.isArray(data?.songs) ? data.songs : [];



      setLikedSongs(results);

      setShowLikedSongs(true);

      setQuery("");

      setSongs([]);

      setYoutubeSongs([]);

      setCurrentYoutubeSong(null);

    } catch (error) {

      console.error("Failed to load liked songs:", error);

      alert("Unable to load liked songs.");

    } finally {

      setLoading(false);

    }

  };



  const toggleLike = async () => {

    if (!currentSong) return;



    const trackId = getTrackId(currentSong);



    if (!trackId) {

      alert("This track does not have a valid Audius track ID.");

      return;

    }



    try {

      if (isLiked) {

        const data = await getLikedSongs();

        const likedTrack = (data?.songs || []).find(

          (song) => String(song.provider_track_id) === String(trackId)

        );



        if (likedTrack?.music_track_id != null) {

          await unlikeSong(likedTrack.music_track_id);

        }



        setIsLiked(false);

        setLikedSongs((previous) =>

          previous.filter(

            (song) =>

              String(song.provider_track_id) !== String(trackId)

          )

        );

      } else {

        await likeSong(currentSong);

        setIsLiked(true);



        // Refresh the liked list so the Library stays synchronized.

        try {

          const data = await getLikedSongs();

          setLikedSongs(Array.isArray(data?.songs) ? data.songs : []);

        } catch (refreshError) {

          console.warn("Liked list refresh failed:", refreshError);

        }

      }

    } catch (error) {

      console.error("Like action failed:", error);

      alert("Unable to update liked song.");

    }

  };



  // Keep the heart state synchronized when the current track changes.

  useEffect(() => {

    let cancelled = false;



    const checkLike = async () => {

      if (!currentSong) {

        setIsLiked(false);

        return;

      }



      try {

        const data = await getLikedSongs();

        const trackId = String(getTrackId(currentSong));



        const liked = (data?.songs || []).some(

          (song) => String(song.provider_track_id) === trackId

        );



        if (!cancelled) {

          setIsLiked(liked);

        }

      } catch (error) {

        if (!cancelled) {

          console.error("Failed to check liked state:", error);

          setIsLiked(false);

        }

      }

    };



    checkLike();



    return () => {

      cancelled = true;

    };

  }, [currentSong]);



  // ============================================================

  // PLAY SONG

  // ============================================================



  const playSong = (song) => {

    setCurrentYoutubeSong(null);

    const songId = getTrackId(song);



    if (!songId) {

      console.error("Track has no valid ID:", song);

      return;

    }



    const currentId = getTrackId(currentSong);



    // Clicking the currently playing song toggles playback.

    if (currentId != null && String(currentId) === String(songId)) {

      if (!audioRef.current) return;



      if (audioRef.current.paused) {

        audioRef.current.play().catch((error) => {

          console.error("Playback failed:", error);

          setIsPlaying(false);

        });

      } else {

        audioRef.current.pause();

      }



      return;

    }



    setCurrentSong(song);

    setCurrentTime(0);

    setDuration(0);

    setIsPlaying(true);

  };



  // ============================================================

  // AUDIO SOURCE

  // ============================================================



  useEffect(() => {

    const audio = audioRef.current;



    if (!audio || !currentSong) return;



    const trackId = getTrackId(currentSong);



    if (!trackId) {

      console.error("Cannot stream track without ID:", currentSong);

      setIsPlaying(false);

      return;

    }



    audio.pause();

    audio.src = getStreamUrl(trackId);

    audio.currentTime = 0;

    audio.volume = isMuted ? 0 : volume;

    audio.load();



    // Store metadata/history only. Audio stays on Audius.

    saveListeningHistory(currentSong).catch((error) => {

      console.error("Failed to save listening history:", error);

    });



    audio

      .play()

      .then(() => setIsPlaying(true))

      .catch((error) => {

        console.error("Audius playback failed:", error);

        setIsPlaying(false);

      });

  }, [currentSong]);



  // ============================================================

  // PLAY / PAUSE

  // ============================================================



  useEffect(() => {

    const audio = audioRef.current;



    if (!audio || !currentSong) return;



    if (isPlaying) {

      audio.play().catch((error) => {

        console.error("Play failed:", error);

        setIsPlaying(false);

      });

    } else {

      audio.pause();

    }

  }, [isPlaying, currentSong]);



  // ============================================================

  // VOLUME

  // ============================================================



  useEffect(() => {

    if (!audioRef.current) return;



    audioRef.current.volume = isMuted ? 0 : volume;

  }, [volume, isMuted]);



  const toggleMute = () => {

    if (!isMuted && volume > 0) {

      previousVolumeRef.current = volume;

    }



    setIsMuted((previous) => !previous);

  };



  const handleVolumeChange = (event) => {

    const nextVolume = Number(event.target.value);



    setVolume(nextVolume);



    if (nextVolume > 0) {

      previousVolumeRef.current = nextVolume;

      setIsMuted(false);

    } else {

      setIsMuted(true);

    }

  };



  // ============================================================

  // AUDIO EVENTS

  // ============================================================



  const handleTimeUpdate = () => {

    if (!audioRef.current) return;

    setCurrentTime(audioRef.current.currentTime || 0);

  };



  const handleLoadedMetadata = () => {

    if (!audioRef.current) return;

    setDuration(

      Number.isFinite(audioRef.current.duration)

        ? audioRef.current.duration

        : 0

    );

  };



  const handleAudioError = (event) => {

    console.error("Audio element error:", event);

  };



  // ============================================================

  // SEEK

  // ============================================================



  const handleSeek = (event) => {

    if (!audioRef.current) return;



    const nextTime = Number(event.target.value);



    if (!Number.isFinite(nextTime)) return;



    audioRef.current.currentTime = nextTime;

    setCurrentTime(nextTime);

  };



  // ============================================================

  // NEXT / PREVIOUS

  // ============================================================



  const playNext = () => {

    if (!songs.length) return;



    const currentId = getTrackId(currentSong);



    let currentIndex = songs.findIndex(

      (song) => String(getTrackId(song)) === String(currentId)

    );



    if (currentIndex < 0) currentIndex = -1;



    if (shuffle && songs.length > 1) {

      let randomIndex = Math.floor(Math.random() * songs.length);



      while (randomIndex === currentIndex) {

        randomIndex = Math.floor(Math.random() * songs.length);

      }



      playSong(songs[randomIndex]);

      return;

    }



    const nextIndex = currentIndex + 1;



    if (nextIndex >= songs.length) {

      if (repeat) {

        playSong(songs[0]);

      } else {

        setIsPlaying(false);

      }



      return;

    }



    playSong(songs[nextIndex]);

  };



  const playPrevious = () => {

    if (!songs.length) return;



    if (audioRef.current && audioRef.current.currentTime > 3) {

      audioRef.current.currentTime = 0;

      setCurrentTime(0);

      return;

    }



    const currentId = getTrackId(currentSong);



    let currentIndex = songs.findIndex(

      (song) => String(getTrackId(song)) === String(currentId)

    );



    if (currentIndex < 0) currentIndex = 0;



    const previousIndex =

      currentIndex <= 0 ? songs.length - 1 : currentIndex - 1;



    playSong(songs[previousIndex]);

  };



  const handleEnded = () => {

    if (!currentSong) return;



    if (repeat) {

      const audio = audioRef.current;



      if (audio) {

        audio.currentTime = 0;

        audio.play().catch((error) => {

          console.error("Repeat playback failed:", error);

          setIsPlaying(false);

        });

      }



      return;

    }



    playNext();

  };



  // ============================================================

  // UI

  // ============================================================



  const displayedSongs = showLikedSongs ? likedSongs : songs;



  const genres = [

    "All",

    "Hindi",

    "Hip Hop",

    "Electronic",

    "Lo-Fi",

    "Rock",

    "Pop",

    "Indie",

    "Chill",

    "Gaming",

    "Workout",

  ];



  return (

    <div className="app">

      {/* ========================================================

          SIDEBAR

      ======================================================== */}



      <aside className="sidebar">

        <div className="logo">

          <div className="logo-icon">♫</div>



          <div>

            <h2>Music Spider</h2>

            <span>Music for everyone</span>

          </div>

        </div>



        <nav className="nav">

          <div

            className="nav-item active"

            onClick={() => {

              setShowLikedSongs(false);

              setQuery("");

            }}

            style={{ cursor: "pointer" }}

          >

            <Home size={20} />

            <span>Home</span>

          </div>



          <div

            className="nav-item"

            onClick={() => {

              document

                .querySelector(".search-box input")

                ?.focus();

            }}

            style={{ cursor: "pointer" }}

          >

            <Search size={20} />

            <span>Search</span>

          </div>



          <div

            className="nav-item"

            onClick={loadLikedSongs}

            style={{ cursor: "pointer" }}

          >

            <Library size={20} />

            <span>Your Library</span>

          </div>



          <div className="nav-item" style={{ cursor: "pointer" }}>

            <ListMusic size={20} />

            <span>Playlists</span>

          </div>



          <div

            className="nav-item"

            onClick={loadLikedSongs}

            style={{ cursor: "pointer" }}

          >

            <Heart size={20} />

            <span>Liked Songs</span>

          </div>



          <div className="nav-item" style={{ cursor: "pointer" }}>

            <Clock3 size={20} />

            <span>Recently Played</span>

          </div>

        </nav>



        <div className="playlist-section">

          <div className="playlist-header">

            <span>PLAYLISTS</span>

            <Plus size={18} />

          </div>



          <div className="playlist">

            <div className="playlist-cover">🎵</div>

            <div>

              <strong>Chill Vibes</strong>

              <small>12 songs</small>

            </div>

          </div>



          <div className="playlist">

            <div className="playlist-cover">🏋️</div>

            <div>

              <strong>Gym Motivation</strong>

              <small>25 songs</small>

            </div>

          </div>



          <div className="playlist">

            <div className="playlist-cover">🌙</div>

            <div>

              <strong>Late Night</strong>

              <small>18 songs</small>

            </div>

          </div>



          <div className="playlist">

            <div className="playlist-cover">💻</div>

            <div>

              <strong>Coding Flow</strong>

              <small>32 songs</small>

            </div>

          </div>

        </div>



        
<div className="profile">
  <div className="avatar">👤</div>

  <div>
    
<button
  type="button"
  className="login-button"
  onClick={() => {
    console.log("SIDEBAR LOGIN CLICKED");
    setShowAuth(true);
  }}
>
  Login / Sign Up
</button>


    <small>Save your music everywhere</small>
  </div>
</div>


      </aside>



      {/* ========================================================

          MAIN

      ======================================================== */}



      <main className="main">

        <header className="topbar">

          <form className="search-box" onSubmit={handleSearch}>

            <Search size={20} />



            <input

              type="text"

              value={query}

              onChange={(event) => {

                setQuery(event.target.value);

                if (showLikedSongs) {

                  setShowLikedSongs(false);

                }

              }}

              placeholder="Search for songs, artists, or genres..."

              aria-label="Search music"

            />



            {loading && (

              <Loader2

                size={19}

                className="loading-icon"

              />

            )}

          </form>

        </header>



        <section className="hero">

          <div className="hero-content">

            <span className="hero-line"></span>



            <h1>

              Good Music

              <br />

              Brighter Days

            </h1>



            <p>Discover. Stream. Feel.</p>

          </div>

        </section>



        <div className="genres">

          {genres.map((genre) => (

            <button

              key={genre}

              className={

                genre === "All" &&

                !query &&

                !showLikedSongs

                  ? "genre active"

                  : "genre"

              }

              onClick={() => handleGenreSearch(genre)}

              type="button"

            >

              {genre === "Hindi" ? "🇮🇳 Hindi" : genre}

            </button>

          ))}

        </div>



        <section className="content-section">

          <div className="section-title">

            <div>

              <h2>

                {showLikedSongs

                  ? "Liked Songs"

                  : query

                    ? `Search Results for "${query}"`

                    : "Search Results"}

              </h2>



              <p>

                {showLikedSongs
                  ? `${displayedSongs.length} liked songs`
                  : displayedSongs.length + youtubeSongs.length > 0
                    ? `${displayedSongs.length} Audius tracks · ${youtubeSongs.length} YouTube videos`
                    : "Search for something you love"}

              </p>

            </div>



            {(displayedSongs.length > 0 || (!showLikedSongs && youtubeSongs.length > 0)) && (

              <button

                type="button"

                onClick={() => {

                  if (showLikedSongs) {

                    setLikedSongs([]);

                  } else {

                    setSongs([]);

                    setYoutubeSongs([]);

                    setCurrentYoutubeSong(null);

                    setQuery("");

                  }

                }}

              >

                Clear

              </button>

            )}

          </div>



          {loading && (

            <div className="empty-state">

              <Loader2

                size={40}

                className="loading-big"

              />



              <h3>Finding music...</h3>



              <p>

                {showLikedSongs

                  ? "Loading your library"

                  : "Searching Audius"}

              </p>

            </div>

          )}



          {!loading && displayedSongs.length === 0 && (showLikedSongs || youtubeSongs.length === 0) && (

            <div className="empty-state">

              <div>🎵</div>



              <h3>

                {showLikedSongs

                  ? "No liked songs yet"

                  : "Find your next favorite song"}

              </h3>



              <p>

                {showLikedSongs

                  ? "Like a song and it will appear here."

                  : "Search for a song, artist, or genre above."}

              </p>

            </div>

          )}



          {!loading && displayedSongs.length > 0 && (

            <div className="song-grid">

              {displayedSongs.map((song) => {

                const artwork = getArtwork(song);

                const artist = getArtist(song);

                const active = isCurrentSong(song);



                // Liked-song API results may contain the Audius metadata

                // under different field names. These fallbacks keep playback working.

                const playableSong = {

                  ...song,

                  track_id:

                    song.track_id ??

                    song.provider_track_id ??

                    song.id,

                  title:

                    song.title ??

                    song.song_title ??

                    "Unknown Song",

                };



                return (

                  <div

                    className="song-card"

                    key={

                      getTrackId(song) ??

                      `${song.title}-${artist}`

                    }

                  >

                    <div

                      className="cover real-cover"

                      style={

                        artwork

                          ? {

                              backgroundImage: `url("${artwork}")`,

                              backgroundSize: "cover",

                              backgroundPosition: "center",

                            }

                          : {}

                      }

                    >

                      {!artwork && <span>🎵</span>}



                      <button

                        className="play-button"

                        onClick={() => playSong(playableSong)}

                        type="button"

                        aria-label={

                          active && isPlaying

                            ? "Pause song"

                            : "Play song"

                        }

                      >

                        {active && isPlaying ? (

                          <Pause

                            size={18}

                            fill="white"

                          />

                        ) : (

                          <Play

                            size={18}

                            fill="white"

                          />

                        )}

                      </button>

                    </div>



                    <h3 title={song.title}>

                      {song.title || "Unknown Song"}

                    </h3>



                    <p>{artist}</p>



                    <div className="song-stats">

                      <span>

                        {formatTime(

                          Number(song.duration || 0)

                        )}

                      </span>



                      <span>

                        ♡ {song.favorite_count || 0}

                      </span>

                    </div>

                  </div>

                );

              })}

            </div>

          )}

        

          {!loading && !showLikedSongs && youtubeSongs.length > 0 && (
            <div className="youtube-results-section" style={{ marginTop: "28px" }}>
              <div className="section-title">
                <div>
                  <h2>YouTube Results</h2>
                  <p>{youtubeSongs.length} videos found</p>
                </div>
              </div>

              <div className="song-grid">
                {youtubeSongs.map((video) => (
                  <div className="song-card" key={video.video_id}>
                    <div className="cover real-cover">
                      {video.thumbnail && (
                        <img
                          src={video.thumbnail}
                          alt={video.title || "YouTube video thumbnail"}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      )}
                      <button
                        className="play-button"
                        type="button"
                        aria-label={`Play ${video.title} on YouTube`}
                        onClick={() => {
                          audioRef.current?.pause();
                          setIsPlaying(false);
                          setCurrentSong(null);
                          setCurrentYoutubeSong(video);
                        }}
                      >
                        <Play size={18} fill="white" />
                      </button>
                    </div>
                    <h3 title={video.title}>{video.title || "Untitled video"}</h3>
                    <p>{video.channel || "YouTube"}</p>
                    <div className="song-stats"><span>YouTube</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentYoutubeSong && (
            <div className="youtube-player-section" style={{ marginTop: "28px" }}>
              <h2>{currentYoutubeSong.title}</h2>
              <iframe
                key={currentYoutubeSong.video_id}
                width="100%"
                height="360"
                src={`https://www.youtube.com/embed/${currentYoutubeSong.video_id}`}
                title={currentYoutubeSong.title || "YouTube player"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                style={{ border: 0, borderRadius: "12px" }}
              />
            </div>
          )}

        </section>



        <section className="content-section">

          <div className="section-title">

            <div>

              <h2>Recommended For You</h2>

              <p>Powered by your music taste</p>

            </div>



            <button

              type="button"

              onClick={() => {

                setQuery("recommended");

                document

                  .querySelector(".search-box input")

                  ?.focus();

              }}

            >

              See All →

            </button>

          </div>



          <div className="recommend-grid">

            <div className="recommend-card">

              <span>🌃</span>

              <div>

                <strong>Night Drive</strong>

                <small>Lo-Fi • 50 songs</small>

              </div>

            </div>



            <div className="recommend-card">

              <span>💻</span>

              <div>

                <strong>Focus Mode</strong>

                <small>Electronic • 40 songs</small>

              </div>

            </div>



            <div className="recommend-card">

              <span>🏋️</span>

              <div>

                <strong>Workout Energy</strong>

                <small>Hip Hop • 60 songs</small>

              </div>

            </div>



            <div className="recommend-card">

              <span>🌧️</span>

              <div>

                <strong>Rainy Days</strong>

                <small>Chill • 45 songs</small>

              </div>

            </div>

          </div>

        </section>

      </main>



      {/* ========================================================

          NOW PLAYING

      ======================================================== */}



      <aside className="now-playing">

        <div className="now-header">

          <h2>Now Playing</h2>

          <span>⌄</span>

        </div>



        <div

          className="now-cover"

          style={

            currentSong && getArtwork(currentSong)

              ? {

                  backgroundImage: `url("${getArtwork(

                    currentSong

                  )}")`,

                  backgroundSize: "cover",

                  backgroundPosition: "center",

                }

              : {}

          }

        >

          {!currentSong && (

            <>

              MUSIC

              <br />

              SPIDER

            </>

          )}

        </div>



        <h3>

          {currentSong

            ? currentSong.title

            : "Nothing Playing"}

        </h3>



        <p>

          {currentSong

            ? getArtist(currentSong)

            : "Choose a song to start listening"}

        </p>



        {currentSong && (

          <div

            style={{

              marginTop: "10px",

              fontSize: "12px",

              color: "#737d90",

            }}

          >

            {formatTime(currentTime)} /{" "}

            {formatTime(duration)}

          </div>

        )}



        <div className="up-next">

          <h3>Queue</h3>



          {songs.slice(0, 5).map((song) => (

            <div

              className="queue-song"

              key={`queue-${getTrackId(song)}`}

            >

              <div className="queue-cover">

                {getArtwork(song) ? (

                  <img

                    src={getArtwork(song)}

                    alt=""

                    style={{

                      width: "100%",

                      height: "100%",

                      objectFit: "cover",

                      borderRadius: "7px",

                    }}

                  />

                ) : (

                  "🎵"

                )}

              </div>



              <div>

                <strong>{song.title}</strong>

                <small>{getArtist(song)}</small>

              </div>



              <button

                type="button"

                onClick={() => playSong(song)}

                style={{

                  background: "transparent",

                  color: "white",

                }}

                aria-label={`Play ${song.title}`}

              >

                {isCurrentSong(song) && isPlaying ? (

                  <Pause size={15} />

                ) : (

                  <Play size={15} />

                )}

              </button>

            </div>

          ))}

        </div>

      </aside>



      {/* ========================================================

          REAL AUDIO ELEMENT

      ======================================================== */}



      <audio

        ref={audioRef}

        onTimeUpdate={handleTimeUpdate}

        onLoadedMetadata={handleLoadedMetadata}

        onEnded={handleEnded}

        onPlay={() => setIsPlaying(true)}

        onPause={() => setIsPlaying(false)}

        onError={handleAudioError}

        preload="metadata"

      />



      {/* ========================================================

          BOTTOM PLAYER

      ======================================================== */}



      <div className="bottom-player">

        <div className="current-song">

          <div className="mini-cover">

            {currentSong && getArtwork(currentSong) ? (

              <img

                src={getArtwork(currentSong)}

                alt=""

                style={{

                  width: "100%",

                  height: "100%",

                  objectFit: "cover",

                  borderRadius: "7px",

                }}

              />

            ) : (

              "🎵"

            )}

          </div>



          <div>

            <strong>

              {currentSong

                ? currentSong.title

                : "Nothing Playing"}

            </strong>



            <small>

              {currentSong

                ? getArtist(currentSong)

                : "Select a song"}

            </small>

          </div>



          <button

            className={

              isLiked

                ? "like-button liked"

                : "like-button"

            }

            onClick={toggleLike}

            title={isLiked ? "Unlike" : "Like"}

            type="button"

            style={{

              border: "none",

              background: "transparent",

              color: isLiked ? "#9b64ff" : "#7b8598",

              cursor: currentSong

                ? "pointer"

                : "default",

              padding: "4px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

            }}

            disabled={!currentSong}

          >

            <Heart

              size={20}

              fill={isLiked ? "currentColor" : "none"}

            />

          </button>

        </div>



        <div className="bottom-controls">

          <div className="controls">

            <button

              className={

                shuffle

                  ? "control-button active"

                  : "control-button"

              }

              onClick={() =>

                setShuffle((value) => !value)

              }

              title="Shuffle"

              type="button"

              disabled={!currentSong}

            >

              <Shuffle size={16} />

            </button>



            <button

              className="control-button"

              onClick={playPrevious}

              disabled={!currentSong}

              title="Previous"

              type="button"

            >

              <SkipBack size={18} />

            </button>



            <button

              className="main-play-button"

              onClick={() => {

                if (!currentSong) return;

                setIsPlaying((value) => !value);

              }}

              disabled={!currentSong}

              title={isPlaying ? "Pause" : "Play"}

              type="button"

            >

              {isPlaying ? (

                <Pause

                  size={18}

                  fill="white"

                />

              ) : (

                <Play

                  size={18}

                  fill="white"

                />

              )}

            </button>



            <button

              className="control-button"

              onClick={playNext}

              disabled={!currentSong}

              title="Next"

              type="button"

            >

              <SkipForward size={18} />

            </button>



            <button

              className={

                repeat

                  ? "control-button active"

                  : "control-button"

              }

              onClick={() =>

                setRepeat((value) => !value)

              }

              title="Repeat"

              type="button"

              disabled={!currentSong}

            >

              <Repeat size={16} />

            </button>

          </div>



          <div className="progress-container">

            <span>{formatTime(currentTime)}</span>



            <input

              type="range"

              min="0"

              max={duration || 0}

              step="0.1"

              value={Math.min(

                currentTime,

                duration || 0

              )}

              onChange={handleSeek}

              disabled={!currentSong || !duration}

              className="progress-bar"

              aria-label="Song progress"

            />



            <span>{formatTime(duration)}</span>

          </div>

        </div>



        <div className="volume">

          <button

            className="volume-button"

            onClick={toggleMute}

            title={isMuted ? "Unmute" : "Mute"}

            type="button"

          >

            {isMuted || volume === 0 ? (

              <VolumeX size={18} />

            ) : (

              <Volume2 size={18} />

            )}

          </button>



          <input

            type="range"

            min="0"

            max="1"

            step="0.01"

            value={isMuted ? 0 : volume}

            onChange={handleVolumeChange}

            className="volume-slider"

            aria-label="Volume"

          />

        </div>

      </div>

    </div>

    

  );

 
{showAuth && (
  <div className="auth-overlay" onClick={() => setShowAuth(false)}>
    <div
      className="auth-modal"
      onClick={(e) => e.stopPropagation()}
    >
      

      <div className="auth-logo">♫</div>

      <h2>
        {authMode === "login"
          ? "Welcome Back"
          : "Create Your Account"}
      </h2>

      <p className="auth-subtitle">
        {authMode === "login"
          ? "Your music is waiting for you."
          : "Join Music Spider and make it yours."}
      </p>

      <button
        className="google-auth-btn"
        onClick={() => alert("Google authentication will be connected next!")}
      >
        <span>G</span> Continue with Google
      </button>

      <div className="auth-divider">
        <span>OR CONTINUE WITH EMAIL</span>
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        {authMode === "signup" && (
          <label>
            Full Name
            <input
              type="text"
              placeholder="Enter your name"
              required
            />
          </label>
        )}

        <label>
          Email Address
          <input
            type="email"
            placeholder="you@example.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            placeholder="Enter your password"
            minLength={6}
            required
          />
        </label>

        {authMode === "login" && (
          <button
            type="button"
            className="forgot-password"
            onClick={() => alert("Password reset will be connected next!")}
          >
            Forgot password?
          </button>
        )}

        <button type="submit" className="auth-submit">
          {authMode === "login" ? "Login" : "Create Account"}
        </button>
      </form>

      <p className="auth-switch">
        {authMode === "login"
          ? "New to Music Spider?"
          : "Already have an account?"}

       
<button
  type="button"
  onClick={() =>
    setAuthMode(authMode === "login" ? "signup" : "login")
  }
>
  {authMode === "login" ? " Sign Up" : " Login"}
</button>

      </p>

      <p className="guest-note">
        You can always close this window and keep listening.
      </p>
    </div>
  </div>
)}
 

}



export default App;



