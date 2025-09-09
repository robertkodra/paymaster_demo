const express = require("express");
const cors = require("cors");
const path = require("path");
// Load env from api/.env then fallback to project root .env if present
require("dotenv").config();
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/", require("./src/routes/health"));
const { authMiddleware } = require("./src/middleware/auth");
app.use("/privy", authMiddleware, require("./src/routes/privy"));

// Start server
app.listen(PORT, () => {
  console.log(`Ready Wallet Paymaster Demo v2.0.0`);
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(process.env.PRIVY_APP_ID);
});
