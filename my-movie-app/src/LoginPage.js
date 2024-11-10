// LoginPage.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebaseConfig";

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem("token")) {
            navigate("/movies");
        }
    }, [navigate]);

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

    const handleGoogleSignIn = async () => {
        try {
            provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
    
            // Optionally, save the token or relevant data to local storage
            localStorage.setItem("googleAuthToken", user.accessToken);
            
            // You can also send the token to your backend for further processing if needed
            console.log("User Info:", user);
    
            navigate("/movies");
        } catch (error) {
            console.error("Error during sign-in:", error);
            setError("Google sign-in failed. Please try again.");
        }
    };
    
    const handleInputChange = (setter) => (e) => {
        setter(e.target.value);
        setError("");  // Clear error on new input
    };
    

    return (
        <div className="background">
            <div className="login-container">
                <h2>Login</h2>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={handleInputChange(setUsername)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={handleInputChange(setPassword)}
                />

                <button onClick={handleLogin} className="login-b">Login</button>
                <button onClick={handleRegister} className="register-b">Register</button>
                <button onClick={handleGoogleSignIn} className="google-signin-button" aria-label="Sign in with Google">Sign in with Google</button>
                {error && <p className="error">{error}</p>}
            </div>
        </div>
    );
}

export default LoginPage;