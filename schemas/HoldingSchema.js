const mongoose = require("mongoose");

const HoldingSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Types.ObjectId,
        ref:"User",
        required:true
    },
    name: {
        type: String,
    },
    qty: {
        type: Number,
    },
    avg: {
        type: Number,
    },
    price: {
        type: Number,
    },
    net: {
        type: String,
    },
    day: {
        type: String,
    },
});

module.exports={HoldingSchema};