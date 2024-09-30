const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  stockQuantity: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Fruit', 'Vegetable', 'Non-veg', 'Breads', 'Other']
  },
  imageUrl: String
}, { timestamps: true });
module.exports = mongoose.model('Item', ItemSchema);