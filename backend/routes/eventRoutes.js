import express from "express";
import User from "../model/userModel.js";
const router = express.Router();
router.put("/check-in/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const user = await User.findOne({  id });
      console.log(id);
      console.log(user);
      if (!user) return res.status(404).json({ message: "User not Found" });
      if (user.present) return res.status(400).json({ message: "Duplicate Entry : Already marked present" });

      user.present = true;
      await user.save();
      res.json({ message: "User marked as present", user });
  } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
});



export default router;
