import React, { useState, useEffect } from "react";
import axios from "axios";
import "./MovieRecommendation.css"; // Import custom styles

function App() {
    const [movies, setMovies] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState(null);
    const [selectedMovie, setSelectedMovie] = useState(null);
    const [loading, setLoading] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState(null); // State for trailer URL

    const API_KEY = "2e7b644a"; // OMDB API key
    const TMDB_API_KEY = "6a710a6d7c5ceda7c0591b94359d7587"; // TMDB API key
    const YOUTUBE_API_KEY = "AIzaSyCFlI4DCTaz7ILp9RHdPuDMmvzY_xVSWXs"; // YouTube API key

    // Function to fetch trending movies
    const fetchTrendingMovies = async () => {
        try {
            const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`);
            if (response.data.results) {
                const trendingMovies = response.data.results.slice(0, 30);
                // Add an OMDb call for each trending movie to get full details
                const moviesWithDetails = await Promise.all(
                    trendingMovies.map(async (movie) => {
                        try {
                            const omdbResponse = await axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&t=${encodeURIComponent(movie.title)}&y=${new Date(movie.release_date).getFullYear()}`);
                            return { ...movie, ...omdbResponse.data };
                        } catch (err) {
                            console.error(`Error fetching details for ${movie.title}:`, err);
                            return movie; // Fallback to TMDB data
                        }
                    })
                );
                setMovies(moviesWithDetails); 
            } else {
                setError("No trending movies found.");
            }
        } catch (error) {
            console.error("Error fetching trending movies:", error);
            setError("An error occurred while fetching trending movies.");
        }
    };

    const fetchMovies = async (query) => {
        setLoading(true);
        setError(null);

        if (!query) {
            setError("No search term provided.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`);
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
            const response = await axios.get(`http://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`);
            setSelectedMovie(response.data);
            fetchTrailer(response.data.Title); // Fetch trailer after getting movie details
        } catch (error) {
            console.error("Error fetching movie details:", error);
        }
    };

    // Function to fetch the trailer URL from YouTube
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

    const closeDetails = () => {
        setSelectedMovie(null);
        setTrailerUrl(null); // Clear trailer URL when closing
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
                <h1>Movie Recommendation API</h1>
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
            </header>

            {loading && <div className="spinner"></div>}
            {error && <p className="error-message">{error}</p>}

            <div className="movies-grid">
                {movies.length > 0 ? (
                    movies.map((movie) => (
                        <div
                            className="movie-card"
                            key={movie.imdbID || movie.id}
                            onClick={() => fetchMovieDetails(movie.imdbID || movie.id)}
                        >
                            <img
                                src={movie.Poster !== "N/A" ? movie.Poster : `https://image.tmdb.org/t/p/w500/${movie.poster_path}`} 
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

            {selectedMovie && (
                <div className="movie-details">
                    <div className="movie-details-content">
                        <button className="close-button" onClick={closeDetails}>
                            &times;
                        </button>
                        <img
                            src={selectedMovie.Poster !== "N/A" ? selectedMovie.Poster : "placeholder.jpg"}
                            alt={selectedMovie.Title}
                            className="details-poster"
                        />
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
                            <p><strong>Awards:</strong> {selectedMovie.Awards || 'N/A'}</p>
                            <p><strong>IMDb Rating:</strong> {selectedMovie.imdbRating || 'N/A'}</p>
                            {trailerUrl && (
                                <div className="trailer-container">
                                    <h3>Trailer</h3>
                                    <iframe
                                        width="560"
                                        height="315"
                                        src={trailerUrl}
                                        title="YouTube Video Player"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}
                        </div>
                    </div>


                </div>
            )}
        </div>
    );
}

export default App;