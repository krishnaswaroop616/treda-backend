const mongoose = require("mongoose");
const { HoldingSchema } = require("../schemas/HoldingSchema");

const HoldingModel = new mongoose.model("Holdings", HoldingSchema);

module.exports = { HoldingModel };