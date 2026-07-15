const mongoose = require('mongoose');
require('dotenv').config();
const Message = require('./models/Message');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const msg = await Message.findOne({}).sort({ createdAt: -1 });
  console.log("Raw from DB via lean:", await Message.findOne({ _id: msg._id }).lean());
  console.log("Via Mongoose doc:", msg.content);
  console.log("toJSON:", msg.toJSON().content);
  mongoose.disconnect();
}

test();
