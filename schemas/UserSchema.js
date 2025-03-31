const mongoose=require("mongoose");
const UserSchema=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    balance:{
        type:Number,
        default:10000,
    }
    
})

module.exports={UserSchema};