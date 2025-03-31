require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");


const { PositionModel } = require("./models/PositionModel");
const { HoldingModel } = require("./models/HoldingModel");
const { OrderModel } = require("./models/OrderModel");
const { UserModel } = require("./models/UserModel");

const PORT = process.env.PORT || 3002;
const url = process.env.MONGO_URI;
const main = require("./db");
const { default: axios } = require("axios");

const app = express();
app.use(cors({
    origin:["http://localhost:3000","https://treda1-frontend.onrender.com/"],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new UserModel({
            username: username,
            email: email,
            password: hashedPassword,
            balance: 10000,
        });

        await newUser.save();
        res.json({ message: "User registered successfully" });
    }
    catch (err) {
        res.json({ message: "Error registring user", err });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const User = await UserModel.findOne({ email });
        if (!User) {
            return res.status(401).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, User.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign({ userId: User._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.cookie("token", token, { httpOnly: true, secure: false, sameSite: "Lax" });
        res.status(200).json({ message: "Login successful", user: { username: User.username, email: User.email } });
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error during login ", err });
    }
});

app.get("/verify", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        res.status(200).json({ user });
    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});


app.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
});



app.get("/getHoldings", async (req, res) => {
    const allHoldings = await HoldingModel.find();
    res.json(allHoldings);
});




app.get("/summary", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ messaage: "Unauthorised" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(401).json({ messaage: "User not found" });

        }
        
        res.json({username:user.username,balance:user.balance});
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }

});



app.get("/getOrders", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorised" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const userOrders = await OrderModel.find({ userId });
        res.json(userOrders);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ message: "Unauthorized" });
    }
});


app.get("/getPositions", async (req, res) => {
    const allPositions = await PositionModel.find();
    res.json(allPositions);
});

app.delete("/deleteOrder/:id",async(req,res)=>{
    try{
        const orderId=req.params.id;
        await OrderModel.findByIdAndDelete(orderId);
        res.status(200).json({message:"Order deleted successfully"});
    }
    catch(err){
        res.status(500).json({ message: "Error deleting order", error: error.message });
    }
})


app.post("/newOrder", async (req, res) => {
    try {
        const { name, qty, price, mode } = req.body;
        const token = req.cookies.token;

        if (!token) {
            res.status(401).json({ message: "Unauthorized" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;
        const user = await UserModel.findById(userId);
        let holding = await HoldingModel.findOne({ userId, name });

        const totalCost = qty * price;
        if (mode == "BUY") {
            if (user.balance < totalCost) {
                return res.status(400).json({ message: "Insufficient balance" });
            }
            user.balance-=totalCost;
            

            if (holding) {

                const newQty = holding.qty + qty;
                const newAvg = ((holding.avg * holding.qty) + (price * qty)) / newQty;
                holding.qty = newQty;
                holding.avg = newAvg;
                holding.price = price;
            } else {

                holding = new HoldingModel({
                    userId,
                    name,
                    qty,
                    avg: price,
                    price,
                    net: "0",
                    day: "0",
                });
            }
            
        }
        else if (mode == "SELL") {
            if(!holding || holding.qty<qty){
                return res.status(400).json({ message: "Not enough stocks to sell!" });
            }
            user.balance+=totalCost;
            holding.qty-=qty;
            if (holding.qty === 0) {
                await HoldingModel.deleteOne({ userId, name }); 
            }
        }

        await user.save();

        if(holding && holding.qty>0){
            await holding.save();
        }
        const newOrder = new OrderModel({
            userId,
            name,
            qty,
            price,
            mode
        });

        await newOrder.save();



        res.status(200).json({ message: "Order placed successfully", order: newOrder });
    }
    catch (err) {
        res.status(401).json({ message: "Error placing order", err });
    }
})



app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    main(url);
});