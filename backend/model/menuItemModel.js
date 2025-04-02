import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    available: { type: Boolean, default: true }
});

export default mongoose.model("MenuItem", menuItemSchema);