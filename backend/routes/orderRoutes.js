import express from "express";
import User from "../model/userModel.js";
import MenuItem from "../model/menuItemModel.js";

const router = express.Router();

// EXPECTED JSON in request body
// POST /api/orders/add/:id
// {
//     "items": [
//         {
//             "menuItemId": "65f8a2b3c4d5e6f7g8h9i0j1",
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

        // Validate each item and check if menuItems exist
        for (const item of items) {
            const menuItem = await MenuItem.findById(item.menuItemId);
            if (!menuItem) {
                return res.status(400).json({ 
                    message: `Menu item with id ${item.menuItemId} not found` 
                });
            }
            if (!menuItem.available) {
                return res.status(400).json({ 
                    message: `Menu item ${menuItem.name} is not available` 
                });
            }
        }

        user.orderedItems = items.map(item => ({
            menuItem: item.menuItemId,
            quantity: item.quantity
        }));
        user.wantsFood = true;

        await user.save();

        // Populate menu item details in response
        await user.populate('orderedItems.menuItem');

        res.status(200).json({ 
            message: "Order added successfully",
            orderedItems: user.orderedItems 
        });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// GET /api/orders fetches all users and the items they ordered
router.get("/", async (req, res) => {
    try {
        const users = await User.find({ wantsFood: true })
            .populate('orderedItems.menuItem')
            .select('name orderedItems -_id');

        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

// GET /api/orders/menu
router.get("/menu", async (req, res) => {
    try {
        const menuItems = await MenuItem.find({ available: true })
            .select('_id name price'); // Now including _id in response

        res.status(200).json({ 
            message: "Menu items retrieved successfully",
            menuItems 
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

// POST /api/orders/menu/add
router.post("/menu/add", async (req, res) => {
    try {
        const { name, price } = req.body;

        // Validate request body
        if (!name || !price) {
            return res.status(400).json({ 
                message: "Missing required fields: name and price are required" 
            });
        }

        // Check if menu item already exists
        const existingItem = await MenuItem.findOne({ name });
        if (existingItem) {
            return res.status(400).json({ 
                message: "Menu item with this name already exists" 
            });
        }

        // Create new menu item
        const menuItem = new MenuItem({
            name,
            price,
            available: true
        });

        await menuItem.save();

        res.status(201).json({ 
            message: "Menu item added successfully",
            menuItem: {
                _id: menuItem._id,
                name: menuItem.name,
                price: menuItem.price
            }
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});


export default router;