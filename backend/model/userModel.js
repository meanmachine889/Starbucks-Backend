import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const orderItemSchema = new mongoose.Schema({
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    quantity: { type: Number, required: true }
});

const userSchema = new mongoose.Schema({
    id: { type: String, unique: true, default: uuidv4 },
    name: String,
    email: { type: String, unique: true, required: true },
    otp: String,
    otpExpires: { type: Date }, 
    registered: { type: Boolean, default: false },
    present: { type: Boolean, default: false },
    wantsFood: { type: Boolean, default: false },
    orderedItems: [orderItemSchema]
});

export default mongoose.model("User", userSchema);