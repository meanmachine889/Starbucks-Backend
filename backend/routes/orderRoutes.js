import express from "express";
import User from "../model/userModel.js";

const router = express.Router();

// EXPECTED JSON in request body
// POST /api/orders/add/:id
// {
//     "items": [
//         {
//             "name": "Latte",
//             "price": 4.99,
//             "quantity": 1
//         },
//         {
//             "name": "Croissant",
//             "price": 3.99,
//             "quantity": 2
//         }
//     ]
// }

router.post("/add/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ id });
        if (!user) return res.status(404).json({ message: "User not Found" });

        const { items } = req.body;
        
        // Validate request body
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ message: "Invalid request body. Expected items array" });
        }

        user.orderedItems = items;
        user.wantsFood = true;

        await user.save();

        res.status(200).json({ 
            message: "Order added successfully",
            orderedItems: user.orderedItems 
        });
    } catch (e) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

router.get("/", async (req, res) => {
    try {
        const users = await User.find(
            { wantsFood: true },
            { name: 1, orderedItems: 1, _id: 0 }
        );

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

export default router;