const express = require('express')
const bookingController = require('../controllers/bookingController')

const authController = require('./../controllers/authController')

const bookingRoute = express.Router()


///1. route for creating checkout session
bookingRoute.get('/checkout-session/:tourId', authController.protect,bookingController.getCheckoutSession)


//2. route for creating new bookings
bookingRoute.get('/my-tours',authController.protect,bookingController.getAllBookings)

//3. create new bookings
bookingRoute.post('/create-booking',authController.protect,authController.restrictTo('admin', 'lead-guide'),bookingController.createBooking)

//4. get one booking with id
bookingRoute.get('/get-one-booking/:id',authController.protect,bookingController.getBooking)

//5. delete booking
bookingRoute.delete('/delete-booking/:id',authController.protect,authController.restrictTo('admin', 'lead-guide'),bookingController.deleteBooking)


//6. update booking
bookingRoute.patch('/update-booking/:id',authController.protect,authController.restrictTo('admin', 'lead-guide'),bookingController.updateBooking)







module.exports = bookingRoute
