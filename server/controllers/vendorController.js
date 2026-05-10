const { Vendor } = require('../models');

// GET /api/vendors — list all vendors (optional ?category=decoration)
exports.getAll = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;

    const vendors = await Vendor.find(filter).sort({ rating: -1 });
    res.json({ vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ error: 'Server error fetching vendors.' });
  }
};

// GET /api/vendors/:id — get single vendor
exports.getById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found.' });
    }
    res.json({ vendor });
  } catch (error) {
    console.error('Get vendor error:', error);
    res.status(500).json({ error: 'Server error fetching vendor.' });
  }
};
