import React, { useState } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post("https://movie-api-h3nu.onrender.com/api/auth/login", {
                username,
                password
            });
            localStorage.setItem("token", response.data.token);
            navigate("/movies");
        } catch (error) {
            setError("Invalid credentials. Please try again.");
        }
    };

    const handleRegister = async () => {
        try {
            await axios.post("https://movie-api-h3nu.onrender.com/api/auth/register", {
                username,
                password
            });
            setError("Registration successful! You can now log in.");
        } catch (error) {
            setError("User already exists or registration error.");
        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button onClick={handleLogin}>Login</button>
            <button onClick={handleRegister}>Register</button>
            {error && <p className="error">{error}</p>}
        </div>
    );
}

export default LoginPage;