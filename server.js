import dotenv from "dotenv";
import express from "express";
import Razorpay from "razorpay";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

// ✅ Razorpay instance (Test Keys)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ Home route
app.get("/", (req, res) => {
  res.send("🚀 Razorpay backend is running!");
});

// ✅ Create Order API
app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100,   // paisa me convert (500 = ₹50000)
      currency: "INR",
      receipt: "receipt_" + Math.floor(Math.random() * 1000),
    };

    const order = await razorpay.orders.create(options);
    console.log("🟢 Order created:", order);
    res.json(order);

  } catch (err) {
    console.error("🔴 Order creation failed:", err);
    res.status(500).send("Error creating order");
  }
});

// ✅ Verify Payment API
app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", "w8JET90d3gjwkG6t7CygYVJk")  // same secret key
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("✅ Payment verified:", razorpay_payment_id);
      res.json({ status: "success", paymentId: razorpay_payment_id });
    } else {
      console.log("❌ Payment verification failed");
      res.status(400).json({ status: "failure" });
    }

  } catch (error) {
    console.error("🔴 Verification error:", error);
    res.status(500).send("Verification failed");
  }
});

// ✅ Server listen
app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
