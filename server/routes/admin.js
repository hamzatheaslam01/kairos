const router = require('express').Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All admin routes require auth + admin role
router.use(auth, roleGuard('admin'));

// Stats & Dashboard
router.get('/stats', adminController.getStats);
router.get('/dashboard', adminController.getStats);

// Bookings
router.get('/bookings', adminController.getAllBookings);
router.patch('/bookings/:id/status', adminController.updateBookingStatus);

// Quotations
router.get('/quotations', adminController.getAllQuotations);
router.patch('/quotations/:id', adminController.respondToQuotation);

// Venues
router.get('/venues', adminController.getAllVenues);
router.post('/venues', adminController.createVenue);
router.put('/venues/:id', adminController.updateVenue);
router.delete('/venues/:id', adminController.deleteVenue);
router.patch('/venues/:id/availability', adminController.updateVenueAvailability);

// Catering
router.get('/catering', adminController.getAllCatering);
router.post('/catering', adminController.createCatering);
router.put('/catering/:id', adminController.updateCatering);
router.delete('/catering/:id', adminController.deleteCatering);

// Vendors (Decorators, Photography, etc.)
router.get('/vendors', adminController.getAllVendors);
router.post('/vendors', adminController.createVendor);
router.put('/vendors/:id', adminController.updateVendor);
router.delete('/vendors/:id', adminController.deleteVendor);

// Deals
router.get('/deals', adminController.getAllDeals);
router.post('/deals', adminController.createDeal);
router.put('/deals/:id', adminController.updateDeal);
router.delete('/deals/:id', adminController.deleteDeal);

// Users
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Cities
router.get('/cities', adminController.getCities);
router.get('/cities/stats', adminController.getCityStats);
router.patch('/cities/rename', adminController.renameCity);

module.exports = router;
