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
      return res
        .status(400)
        .json({ message: "User already registered. Please check your email" });
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
      subject: "Your OTP Code for MTTNxStarbucks",
      text: `Your OTP is: ${otp}. It will expire in 5 minutes.`, // Fallback plain text
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; text-align: center; color: #333;">
          <h1 style="color: #006241;">Welcome to MTTNxStarbucks!</h1>
          <p>Your One-Time Password (OTP) is:</p>
          <h2 style="color: #006241; font-size: 32px; letter-spacing: 5px;">${otp}</h2>
          <p>This code will expire in 5 minutes.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; border-radius: 5px;">
            <p style="margin: 0; color: #666;">If you didn't request this OTP, please ignore this email.</p>
          </div>
          <p style="font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px;">
            This is an automated message from MTTNxStarbucks. Please do not reply.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({
      message: "OTP sent successfully. Verify OTP to complete registration.",
    });
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
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    if (user.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });
    const { qrBufferFinal, qrLink, uuid } = await generateQR(user);
    user.otp = null;
    user.otpExpires = null;

    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: "Your MTTNxStarbucks QR Code",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; text-align: center; color: #333;">
          <h1 style="color: #006241;">Thanks for registering!</h1>
          <p>Here is your ticket for MTTN x Starbucks Acoustic Night.<br/><strong>Please arrive by 7:15 PM. Your booking will not be held past 7:30 PM.</strong></p>
          <div style="margin: 20px 0;">
            <a href="${qrLink}" style="text-decoration: none;">
              <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px; border-radius: 10px;" />
            </a>
          </div>
          <div style="margin: 20px 0;">
            <a href="https://www.starbucks.com/menu" 
              style="display: inline-block; 
                      background-color: #006241; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;">
              Explore Menu
            </a>
          </div>
          <p>Need help? Contact us at <a href="mailto:bdpr.mttn@gmail.com">bdpr.mttn@gmail.com</a></p>
          <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
        </div>
      `,
      attachments: [
        {
          filename: "qrcode.png",
          content: qrBufferFinal,
          encoding: "base64",
          cid: "qrcode",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    user.registered = true;
    await user.save();
    res.json({ message: "OTP verified. Registration complete. QR code sent.", data: { id: user.id, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/user", async (req, res) => {
  const { id } = req.query;

  try {
    const user = await User.findOne({ id });

    if (!user) {
      return res.json([]);
    }

    res.json({ name: user.name, email: user.email, confirmed: user.wantsFood, mobile: user.otp });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get-users-length", async (req, res) => {
  try {
    const length = await User.countDocuments();
    res.status(200).json({length: length});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/send-confirmation", async (req, res) => {
  try {
    const users = await User.find({});
    
    for (const user of users) {
      const confirmationLink = `https://events.manipalthetalk.org/congratulations?id=${user.id}`;

      const mailOptions = {
        from: process.env.EMAIL,
        to: user.email,
        subject: "Confirm Your Presence - MTTN x Starbucks Acoustic Night",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; text-align: center; color: #333;">
            <h1 style="color: #006241;">Confirm Your Attendance</h1>
            <p>We’re excited to see you at the MTTN x Starbucks Acoustic Night! Please confirm your presence by clicking the button below.</p>
            <div style="margin: 20px 0;">
              <a href="${confirmationLink}" 
                style="display: inline-block; 
                        background-color: #006241; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;">
                Confirm Attendance
              </a>
            </div>
            <p> Please make sure to arrive by 7:15 PM, as we won't be able to hold reservations past 7:30 PM. We can't wait to see you there! </p>
            <p>If you do not confirm, your booking will be canceled.</p>
            <p>Need help? Contact us at <a href="mailto:bdpr.mttn@gmail.com">bdpr.mttn@gmail.com</a></p>
            <p style="font-size: 12px; color: #777;">This email was sent automatically. Please do not reply.</p>
          </div>
        `,
      };
      
      await transporter.sendMail(mailOptions);
    }
    
    res.json({ message: "Confirmation emails sent to all users." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route to handle confirmation link click
router.post("/confirm-attendance/:email/:mobile", async (req, res) => {
  try {
    const { email, mobile } = req.params;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: "Invalid mobile number. It should be 10 digits long." });
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(user.otp == null || user.otp == "") || !user.registered) return res.status(404).json({ message: "You have not registered" });

    user.wantsFood = true;
    user.otp = mobile;
    await user.save();

    res.send("Thank you for confirming your attendance!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/cancel-attendance/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({email});

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.registered) return res.status(404).json({ message: "You have not registered" });

    user.wantsFood = false;
    user.otp = null;
    await user.save();

    res.send("Attendance cancel!");
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.post("/verify-confirmation/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({email});

    if (!user) return res.status(404).json({ message: "User not found" }); 

    const confirmed = user.wantsFood;
    res.status(200).json({ confirmed: confirmed });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
