const mongoose=require("mongoose");
const {OrderSchema}=require("../schemas/OrderSchema");

const OrderModel=mongoose.model("Orders",OrderSchema);

module.exports={OrderModel};