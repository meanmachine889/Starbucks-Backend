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
      return res.status(400).json({ message: "User already registered. Please check your email" });
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
 

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your Starbucks QR Code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; text-align: center; color: #333;">
          <h1 style="color: #006241;">Thanks for registering!</h1>
          <p>Here is your Starbucks QR code. Scan it to access your page and enjoy exclusive offers!</p>
          <div style="margin: 20px 0;">
            <a href="${qrLink}" style="text-decoration: none;">
              <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border-radius: 10px;" />
            </a>
          </div>
          <p>Need help? Contact us at <a href="mailto:support@starbucks.com">support@starbucks.com</a></p>
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `,
      attachments: [{
        filename: "qrcode.png",
        content: qrBufferFinal,
        encoding: "base64",
        cid: "qrcode",
      }],
    };

    await transporter.sendMail(mailOptions);
    user.registered = true;
    await user.save(); 
    res.json({ message: "OTP verified. Registration complete. QR code sent." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
