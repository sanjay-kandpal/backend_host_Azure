const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const authMiddleware = require('../middleware/auth');


router.get('/items',authMiddleware, async (req, res) => {
  try {
    const { category, minPrice, maxPrice, sortBy } = req.query;
    let query = {};
    if (category) {
      query.category = category;
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    let items = Item.find(query);
    
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      items = items.sort({ [field]: order === 'desc' ? -1 : 1 });
    }
    
    items = await items.exec();
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

// New route for fetching a single item by ID
router.get('/items/:id',authMiddleware, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Error fetching item', error: error.message });
  }
});


module.exports = router;