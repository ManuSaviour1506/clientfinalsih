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
    age: { type: Number },
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    location: {
      city: { type: String },
      state: { type: String },
    },
    avatar: {
      type: String, // Store Cloudinary URL or similar
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

// Method to compare passwords
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

// Method to generate JWT
userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        { _id: this._id, email: this.email, role: this.role, name: this.name },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // <-- Increased token expiration to 30 days
    );
}

export const User = mongoose.model("User", userSchema);
