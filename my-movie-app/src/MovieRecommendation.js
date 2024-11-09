import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieRecommendation.css"; // Import custom styles
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faYoutube,
  faFacebook,
  faTwitter,
  faInstagram
} from "@fortawesome/free-brands-svg-icons";

function App() {
  const [movies, setMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState(null); // State for trailer URL
  const [selectedGenre, setSelectedGenre] = useState(null); // State for selected genre

  const API_KEY = "2e7b644a"; // OMDB API key
  const TMDB_API_KEY = "6a710a6d7c5ceda7c0591b94359d7587"; // TMDB API key
  const YOUTUBE_API_KEY = "AIzaSyCFlI4DCTaz7ILp9RHdPuDMmvzY_xVSWXs"; // YouTube API key

  const genres = [
    { id: 28, name: "Action" },
    { id: 12, name: "Adventure" },
    { id: 16, name: "Animation" },
    { id: 35, name: "Comedy" },
    { id: 80, name: "Crime" },
    { id: 99, name: "Documentary" },
    { id: 18, name: "Drama" },
    { id: 10751, name: "Family" },
    { id: 14, name: "Fantasy" },
    { id: 36, name: "History" },
    { id: 27, name: "Horror" },
    { id: 9648, name: "Mystery" },
    { id: 10749, name: "Romance" },
    { id: 878, name: "Science Fiction" },
    { id: 53, name: "Thriller" },
    { id: 10752, name: "War" },
    { id: 37, name: "Western" },
  ];

 // Updated fetchMoviesByGenre function
async function fetchMoviesByGenre(genreId) {
  try {
    const response = await axios.get("https://api.themoviedb.org/3/discover/movie", {
      params: {
        api_key: TMDB_API_KEY,
        with_genres: genreId,
      },
    });
    const tmdbMovies = response.data.results;

    // Fetch additional details for each movie from OMDB
    const moviesWithDetails = await Promise.all(
      tmdbMovies.map(async (movie) => {
        const title = movie.title;
        const releaseYear = new Date(movie.release_date).getFullYear();

        try {
          const omdbResponse = await axios.get(`https://www.omdbapi.com/`, {
            params: {
              apikey: API_KEY,
              t: title,
              y: releaseYear,
            },
          });
          
          if (omdbResponse.data.Response === "True") {
            // Merge TMDB and OMDB data
            return { ...movie, ...omdbResponse.data };
          } else {
            console.error(`OMDB error for ${title}: ${omdbResponse.data.Error}`);
            return movie; // Fallback to TMDB data if OMDB data is not available
          }
        } catch (error) {
          console.error(`Error fetching OMDB details for ${title}:`, error);
          return movie; // Fallback to TMDB data in case of error
        }
      })
    );

    setMovies(moviesWithDetails);
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
  }
}


  const fetchMovies = async (query) => {
    setLoading(true);
    setError(null);

    if (!query) {
        setError("No search term provided.");
        setLoading(false);
        return;
    }

    try {
        const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
        if (response.data.Response === "True") {
            setMovies(response.data.Search);
            setError(null); // Clear any previous errors
        } else {
            setMovies([]);
            setError(response.data.Error); // Handle API response errors
        }
    } catch (error) {
        setError("An error occurred while fetching data.");
        console.error("Error fetching movies:", error);
    } finally {
        setLoading(false);
    }
};

const fetchMovieDetails = async (id) => {
    try {
        const response = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`);
        setSelectedMovie(response.data);
        fetchTrailer(response.data.Title); // Fetch trailer after getting movie details
    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
};

  const closeDetails = () => {
    setSelectedMovie(null);
    setTrailerUrl(null); // Clear trailer URL when closing
  };

  const fetchTrendingMovies = async () => {
    setLoading(true); // Show loading before fetching data
    setError(null);

    try {
        const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`);
        if (response.data.results) {
            const trendingMovies = response.data.results.slice(0, 30);
            // Add an OMDb call for each trending movie to get full details
            const moviesWithDetails = await Promise.all(
                trendingMovies.map(async (movie) => {
                    // Check for missing title or release date
                    if (!movie.title || !movie.release_date) {
                        console.error(`Missing title or release date for movie:`, movie);
                        return movie; // Skip OMDB call if title or release date is missing
                    }

                    try {
                        const omdbResponse = await axios.get(`https://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movie.title)}&y=${new Date(movie.release_date).getFullYear()}`);
                        
                        // Check if OMDb returns valid data
                        if (omdbResponse.data.Response === "True") {
                            return { ...movie, ...omdbResponse.data };
                        } else {
                            console.error(`OMDB API error for ${movie.title}:`, omdbResponse.data.Error);
                            return movie; // Fallback to TMDB data
                        }
                    } catch (err) {
                        console.error(`Error fetching details for ${movie.title}:`, err);
                        return movie; // Fallback to TMDB data in case of error
                    }
                })
            );
            setMovies(moviesWithDetails); 
        } else {
            setError("No trending movies found.");
        }
    } catch (error) {
        console.error("Error fetching trending movies:", error);
        if (error.response && error.response.status === 429) {
            setError("API rate limit exceeded. Please try again later.");
        } else {
            setError("An error occurred while fetching trending movies.");
        }
    } finally {
        setLoading(false); // Hide loading after fetching
    }
};

const fetchTrailer = async (title) => {
  const query = encodeURIComponent(`${title} trailer`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${YOUTUBE_API_KEY}&type=video&regionCode=US&videoEmbeddable=true`;

  try {
      const response = await axios.get(url);
      if (response.data.items.length > 0) {
          const videoId = response.data.items[0].id.videoId; // Get the first video ID
          setTrailerUrl(`https://www.youtube.com/embed/${videoId}`); // Set the trailer URL
      } else {
          setTrailerUrl(null);
      }
  } catch (error) {
      console.error("Error fetching trailer:", error);
      setTrailerUrl(null);
  }
};

  const handleSpeechSearch = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      fetchMovies(transcript);
    };
    recognition.start();
  };

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
       <div><center> <h1 className="line1">Search for movies you love and discover everything about them!❤️</h1> </center></div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchMovies(searchQuery);
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type something..."
            className="search-input"
          />
          <button type="button" onClick={handleSpeechSearch} className="speech-button">
            🎤
          </button>
          <button type="submit" className="search-button">
            Search
          </button>
        </form>

        {/* Genre Buttons */}
        <div className="genre-buttons">
          {genres.map((genre) => (
            <button
              key={genre.id}
              className="genre-button"
              onClick={() => {
                setSelectedGenre(genre.id);
                fetchMoviesByGenre(genre.id); // Use fetchMoviesByGenre here
              }}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </header>

      {loading && <div className="spinner"></div>}
      {error && <p className="error-message">{error}</p>}

      <center><h2>Trending Today</h2></center>
      <div className="movies-grid">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div
              className="movie-card"
              key={movie.imdbID || movie.id}
              onClick={() => fetchMovieDetails(movie.imdbID || movie.id)}
            >
              <img
                src={
                  movie.Poster !== "N/A"
                    ? movie.Poster
                    : movie.poster_path
                    ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}`
                    : "placeholder.jpg"
                }
                alt={movie.Title || movie.title}
                className="movie-poster"
              />
              <div className="movie-info">
                <h3>{movie.Title || movie.title}</h3>
                <p>{movie.Released || movie.release_date}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No movies found.</p>
        )}
      </div>
      
      <div>
        <p className="social-container">
          <a className="youtube social">
            <FontAwesomeIcon icon={faYoutube} size="3x" />
          </a>
          <a className="facebook social">
            <FontAwesomeIcon icon={faFacebook} size="3x" />
          </a>
          <a className="twitter social">
            <FontAwesomeIcon icon={faTwitter} size="3x" />
          </a>
          <a className="instagram social">
            <FontAwesomeIcon icon={faInstagram} size="3x" />
          </a>
        </p>
        <p>Made by Dharshini, Divya and Dharun.</p>
      </div>

      {selectedMovie && (
        <div className="movie-details">
          <div className="movie-details-content">
            <button className="close-button" onClick={closeDetails}>
              &times;
            </button>
            {trailerUrl ? (
              <div className="trailer-section">
                <h3>Watch the Trailer</h3>
                <iframe
                  width="560"
                  height="315"
                  src={trailerUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <p>Trailer not available</p>
            )}
            <div className="details-info">
              <h2>{selectedMovie.Title}</h2>
              <p><strong>Released:</strong> {selectedMovie.Released || 'N/A'}</p>
              <p><strong>Runtime:</strong> {selectedMovie.Runtime || 'N/A'}</p>
              <p><strong>Category:</strong> {selectedMovie.Genre || 'N/A'}</p>
              <p><strong>Director:</strong> {selectedMovie.Director || 'N/A'}</p>
              <p><strong>Writer:</strong> {selectedMovie.Writer || 'N/A'}</p>
              <p><strong>Actors:</strong> {selectedMovie.Actors || 'N/A'}</p>
              <p><strong>Plot:</strong> {selectedMovie.Plot || 'N/A'}</p>
              <p><strong>Language:</strong> {selectedMovie.Language || 'N/A'}</p>
              <p><strong>Country:</strong> {selectedMovie.Country || 'N/A'}</p>
              <p><strong>IMDB Rating:</strong> {selectedMovie.imdbRating || 'N/A'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
