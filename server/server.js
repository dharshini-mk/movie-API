const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const API_KEY = '6a710a6d7c5ceda7c0591b94359d7587';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("MongoDB connection error:", error));

  app.get('/api/trending', async (req, res) => {
    try {
      const response = await axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`);
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching trending movies:', error);
      res.status(500).send('Server Error');
    }
  });

  app.use(cors());  // Enable CORS for all routes

// Import routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const PORT = 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));