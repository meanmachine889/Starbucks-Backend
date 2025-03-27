import express from "express";
import User from "../model/userModel.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { generateQR } from "../utils/qrGenerator.js"; 
dotenv.config();
const router = express.Router();

if (!process.env.EMAIL || !process.env.PASSWORD) {
  throw new Error("Error sending Email");
}

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  secure: true,
  host: "smtp.gmail.com",
  port: "465",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/register", async (req, res) => {
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user && user.registered) {
      return res.status(400).json({ message: "User already registered. Please log in." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    if (!user) {
      user = new User({ name, email, otp, otpExpires });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
    }

    await user.save();

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "OTP sent successfully. Verify OTP to complete registration." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

    // Generate QR Code
    const { qrBufferFinal, qrLink, uuid } = await generateQR(email, user);
    user.otp = null;
    user.otpExpires = null;
    await user.save(); 

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your QR Code",
      html: `<p>Scan this QR code to access your page:</p><a href="${qrLink}"><img src="cid:qrcode" /></a>`,
      attachments: [{
        filename: "qrcode.png",
        content: qrBufferFinal,
        encoding: "base64",
        cid: "qrcode",
      }],
    };

    await transporter.sendMail(mailOptions);
    user.registered = true;
    res.json({ message: "OTP verified. Registration complete. QR code sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
