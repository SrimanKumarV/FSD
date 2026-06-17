const mongoose = require('mongoose');
require('dotenv').config({ path: __dirname + '/.env' });
const User = require('./models/User');
const Message = require('./models/Message');
const Notification = require('./models/Notification');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const user1 = await User.findOne({ email: 'srimankumar06@gmail.com' });
    const user2 = await User.findOne({ role: 'alumni' });
    
    if (user1 && user2) {
      console.log('Sending message from', user1.name, 'to', user2.name);
      
      const receiver = user2._id;
      const conversationId = Message.generateConversationId(user1._id, receiver);

      const message = new Message({
        sender: user1._id,
        receiver,
        content: "Test message from script",
        messageType: 'text',
        conversationId,
      });

      await message.save();
      
      await message.populate('sender', 'name photo role');
      await message.populate('receiver', 'name photo role');
      
      console.log("Message saved and populated!");

      // Create notification for receiver
      await Notification.createNotification({
        recipient: receiver,
        sender: user1._id,
        type: 'message-received',
        title: 'New Message',
        content: `You have a new message from ${user1.name}`,
        relatedData: { messageId: message._id }
      });
      console.log("Notification saved!");

    } else {
      console.log('Users not found');
    }
  } catch (err) {
    console.error("Error occurred:", err);
  }
  process.exit(0);
});
