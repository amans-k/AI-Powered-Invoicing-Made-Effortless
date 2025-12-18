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

    businessName: { 
      type: String, 
      default: "",
    },
    address: { 
      type: String, 
      default: "",
    },
    phone: { 
      type: String, 
      default: "",
    },
  },
  { 
    timestamps: true 
  }
);

// REMOVE THE PRE-SAVE MIDDLEWARE COMPLETELY FOR NOW
// We're handling password hashing in the controller

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);