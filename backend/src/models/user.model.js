import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["athlete", "coach", "admin"],
      default: "athlete",
    },
    age:    { type: Number, min: 5, max: 100 },
    height: { type: Number, min: 50, max: 300 },  // cm
    weight: { type: Number, min: 20, max: 500 },  // kg
    location: {
      city:  { type: String, trim: true },
      state: { type: String, trim: true },
    },
    avatar: {
      type: String,
      default: "https://placehold.co/150x150/eef2f3/8e9eab?text=Profile",
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate JWT
userSchema.methods.generateAccessToken = function () {
  // BUG FIX 1: The env key used here was process.env.JWT_SECRET but
  // auth.middleware.js verifies with process.env.ACCESS_TOKEN_SECRET.
  // These are TWO DIFFERENT env variables — if only one is set, either
  // login or verification breaks. Standardised to ACCESS_TOKEN_SECRET
  // throughout. Make sure your .env has ACCESS_TOKEN_SECRET set.
  return jwt.sign(
    {
      _id:   this._id,
      email: this.email,
      role:  this.role,
      name:  this.name,
    },
    process.env.ACCESS_TOKEN_SECRET,   // ← was JWT_SECRET (wrong)
    { expiresIn: '30d' }
  );
};

// BUG FIX 2: No index on email — User.findOne({ email }) in login and
// register runs a full collection scan on every request.
userSchema.index({ email: 1 });

export const User = mongoose.model("User", userSchema);