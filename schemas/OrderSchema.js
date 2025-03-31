const mongoose = require("mongoose");

const OrderSchema=new mongoose.Schema({
    userId:{
      type:mongoose.Types.ObjectId,
      ref:"User",
      required:true,  
    },
    name:{
        type:String,
        required:true,
    },
    qty:{
        type:Number,
        required:true,

    },
    price:{
        type:Number,
        required:true,

    },
    mode:{
        type:String,
        required:true,

    },

});

module.exports={OrderSchema};