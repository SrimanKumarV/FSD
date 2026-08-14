const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const auth = require('../middleware/auth');

// Get all businesses
router.get('/', async (req, res) => {
  try {
    const businesses = await Business.find()
      .populate('founder', 'name email profilePicture')
      .sort({ createdAt: -1 });
    res.json({ businesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    res.status(500).json({ message: 'Server error fetching businesses' });
  }
});

// Create a business
router.post('/', auth.protect, async (req, res) => {
  try {
    const { name, industry, location, stage, description, logo, website, hiring, tags } = req.body;

    const business = new Business({
      name,
      founder: req.user.id,
      industry,
      location,
      stage,
      description,
      logo,
      website,
      hiring,
      tags
    });

    await business.save();
    res.status(201).json({ message: 'Business created successfully', business });
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ message: 'Server error creating business' });
  }
});

// View a business
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('founder', 'name email profilePicture');
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Increment views
    business.views += 1;
    await business.save();

    res.json({ business });
  } catch (error) {
    console.error('Error fetching business:', error);
    res.status(500).json({ message: 'Server error fetching business' });
  }
});

// Update a business
router.put('/:id', auth.protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check ownership
    if (business.founder.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this business' });
    }

    const { name, industry, location, stage, description, logo, website, hiring, tags } = req.body;
    
    business.name = name || business.name;
    business.industry = industry || business.industry;
    business.location = location || business.location;
    business.stage = stage || business.stage;
    business.description = description || business.description;
    business.logo = logo !== undefined ? logo : business.logo;
    business.website = website !== undefined ? website : business.website;
    business.hiring = hiring !== undefined ? hiring : business.hiring;
    business.tags = tags || business.tags;

    await business.save();
    res.json({ message: 'Business updated successfully', business });
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ message: 'Server error updating business' });
  }
});

// Delete a business
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    // Check ownership
    if (business.founder.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this business' });
    }

    await business.deleteOne();
    res.json({ message: 'Business deleted successfully' });
  } catch (error) {
    console.error('Error deleting business:', error);
    res.status(500).json({ message: 'Server error deleting business' });
  }
});

module.exports = router;
