import React, {useState, useEffect} from 'react'
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import {useDebounce} from "react-use";
import {getTrendingMovies, updateSearchCount} from "./appwrite.js";

// API - Application Programming Interface
// [a set of rules that allow one software application to talk to another]
const API_BASE_URL = 'https://api.themoviedb.org/3';


const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`
    }
}

const App = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debounceSearchTerm, setDebounceSearchTerm] = useState('')
    const [trendingMovies, setTrendingMovies] = useState([]);

    // Debounce the search term to prevent making too many API requests, optimize the performance
    // by waiting for the user on finish typing for 500ms
    useDebounce(() => setDebounceSearchTerm(searchTerm), 500, [searchTerm]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                :`${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if(!response.ok) {
                throw new Error('Failed to fetch movies');
            }

            const data = await response.json();

            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }

            setMovieList(data.results || []);

            if(query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.log(`Error fetching movies: ${error.message}`);
            setErrorMessage(`Error fetching movies. Please try again later.`);
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try {
        const movies = await getTrendingMovies();

        setTrendingMovies(movies);
        } catch (error) {
            console.log(`Error fetching trending movies: ${error.message}`);
        }
    }

    useEffect(()=> {
fetchMovies(debounceSearchTerm);
    },[debounceSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    },[]);

    return (
        <main>

            <div className={'pattern'}/>

            <div className={"wrapper"}>
                <header>
                    <img src={"./hero.png"} alt={"Hero Banner"} />
                    <h1>Find <span className={"text-gradient"}>Movies</span> You'll Enjoy Without the Hassle</h1>


                <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
                </header>

                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2 className='text-5xl mb-5'>Trending Movies</h2>

                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img className='ml-4 size-54' src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}


                <section className={"all-movies"}>
                <h2 className={'text-5xl'}> All Movies</h2>

                    {isLoading ? (
                        <div className={"flex items-center gap-5"}>
                        <Spinner/>
                        <p className={"text-white text-xl "}>Loading...</p>
                        </div>
                    ): errorMessage ? (
                        <p className={"text-red-500"}>{errorMessage}</p>
                    ): (
                        <ul>
                            {movieList.map((movie) => (
                                <MovieCard  key={movie.id} movie={movie}/>
                                ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    )
}
export default App
