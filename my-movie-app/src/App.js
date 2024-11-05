// client/src/App.js
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import MovieRecommendation from "./MovieRecommendation";
import LoginPage from "./LoginPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LoginPage/>} />
                <Route path="/movies" element={<MovieRecommendation />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;