const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  console.log("🔒 Auth Middleware - Headers:", req.headers.authorization?.substring(0, 50) + "...");
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];
      console.log("🔒 Token received:", token?.substring(0, 30) + "...");

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("🔒 Token decoded:", decoded);

      // Get user from token
      req.user = await User.findById(decoded.id).select("-password");
      console.log("🔒 User found:", req.user ? "YES" : "NO");
      
      if (!req.user) {
        console.log("🔒 User not found with ID:", decoded.id);
        return res.status(401).json({ message: "User not found" });
      }

      console.log("🔒 Auth successful for user:", req.user.email);
      next();
    } catch (error) {
      console.error("🔒 Auth error:", error.message);
      return res.status(401).json({ 
        message: "Not authorized, token failed",
        error: error.message 
      });
    }
  } else {
    console.log("🔒 No token or invalid format");
  }

  if (!token) {
    console.log("🔒 No token provided");
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };