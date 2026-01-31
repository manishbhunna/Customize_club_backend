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


const BOT_URL=`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`;

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
    console.log("🟢 Order created:");
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
      console.log("✅ Payment verified");
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

let orderPayload = null;
let selecteddata=null

// Order route
app.post("/api/order", async (req, res) => {
  orderPayload = req.body;
  

  let allcartitems=orderPayload.cart.map((item,index)=>({
     index:index+1,
     productname: item.name,
     userInputs: item.userInputs,
     Productid :item.Productid,
     Quantity:item.qty,
     price:item.price
  }))


  selecteddata={
    "cart":allcartitems,
    "address":orderPayload.address,
    "paymentInfo":orderPayload.paymentInfo,
  }

const productText = allcartitems.map(item => `
🧾 Product #${item.index}
• Name: ${item.productname}
• Quantity: ${item.Quantity}
• Price: ₹${item.price}

🎨 Customization:
${Object.entries(item.userInputs)
  .map(([key, value]) => `   - ${key}: ${value}`)
  .join("\n")}
`).join("\n\n");

const addressText = `
👤 Name: ${selecteddata.address.name}
🏠 Address: ${selecteddata.address.flat}, ${selecteddata.address.landmark}
🏙 City: ${selecteddata.address.city}, ${selecteddata.address.state}
📮 PIN: ${selecteddata.address.pin}
📞 Phone: ${selecteddata.address.phone}
`;

const paymentText = `
💳 Payment Status: ${selecteddata.paymentInfo.status}
🧾 Payment ID: ${selecteddata.paymentInfo.paymentId}
📦 Order ID: ${selecteddata.paymentInfo.orderId}
`;

const message = `
🛒 *New Order Received*

📦 *Product Details*
${productText}

📍 *Delivery Address*
${addressText}

💰 *Payment Details*
${paymentText}
`;


    async function sendtotelegram() {
  try {
   
    const response = await fetch(BOT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id:process.env.CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    return response;

  } catch (error) {
    console.error("❌ Error in send to telegram:", error);
    throw error;
  }
}
    await sendtotelegram();


  // Respond success
  res.json({ 
    success: true, 
    message: "Order received successfully",
    data:selecteddata });
});

// GET – browser / HTML ko data de
app.get("/api/order", (req, res) => {
  if (!selecteddata) {
    return res.json({ message: "No order data yet" });
  }

  res.json(selecteddata);
});


// ✅ Server listen
app.listen(5000, () => {
  console.log("✅ Backend running on http://localhost:5000");
});
