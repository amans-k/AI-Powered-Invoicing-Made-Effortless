// models/User.js

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // Personal/Business Information
    businessName: { 
      type: String, 
      default: "Cotton Stock Kids Wear", // Default business name
    },
    
    businessEmail: {
      type: String,
      default: "cottonstockkidswear27@gmail.com", // Fixed business email
    },
    
    businessPhone: {
      type: String,
      default: "9892613808", // Fixed business phone
    },
    
    address: { 
      type: String, 
      default: "", // User will fill this
    },
    
    // Personal phone (optional)
    phone: { 
      type: String, 
      default: "",
    },
  },
  { 
    timestamps: true 
  }
);

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);