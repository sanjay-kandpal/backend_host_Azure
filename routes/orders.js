// routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Item = require('../models/Item');
const auth = require('../middleware/auth');

router.post('/create', auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // check stock levels
    const stockErrors = [];
    for (const cartItem of cart.items) {
      const item = await Item.findById(cartItem.item._id);
      if (item.stockQuantity < cartItem.quantity) {
        stockErrors.push(`Not enough stock for ${item.name}. Available: ${item.stockQuantity}, Requested: ${cartItem.quantity}`);
      }
    }

    if (stockErrors.length > 0) {
      return res.status(400).json({ stockError: stockErrors.join('; ') });
    }

    // Check inventory and calculate total
    let totalAmount = 0;
    for (let cartItem of cart.items) {
      const item = await Item.findById(cartItem.item._id);
      if (item.stockQuantity < cartItem.quantity) {
        return res.status(400).json({ message: `Not enough stock for ${item.name}` });
      }
      totalAmount += item.price * cartItem.quantity;
      // Update inventory
      item.stockQuantity -= cartItem.quantity;
      item.stockQuantity = Math.max(0,item.stockQuantity);

      await item.save();
      // Log the stock update
      console.log(`Updated stock for ${item.name}: ${item.stockQuantity}`);
    }

    // Create order
    const order = new Order({
      user: req.user,
      items: cart.items.map(item => ({
        item: item.item._id,
        quantity: item.quantity,
        price: item.item.price
      })),
      totalAmount
    });
    await order.save();

    // update stock levels and save the order
    for (const orderItem of order.items) {
      const item = await Item.findById(orderItem.item);
      item.stockQuantity -= orderItem.quantity;
      await item.save();
    }
    
    await order.save()

    // Clear cart
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error: error.message });
  }
});
router.get('/history', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user }).populate('items.item');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order history', error: error.message });
  }
});


module.exports = router;