const mongoose=require("mongoose");
const {PositionSchema}=require("../schemas/PositionSchema");

const PositionModel=mongoose.model("Positions",PositionSchema);

module.exports={PositionModel};