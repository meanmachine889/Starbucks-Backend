import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: uuidv4 },
  name: String,
  email: { type: String, unique: true, required: true },
  otp: String,
  otpExpires: { type: Date }, 
  registered: { type: Boolean, default: false },
  present: { type: Boolean, default: false },
});

export default mongoose.model("User", userSchema);
