const express = require('express')
const reviewsControllerClass = require('../controllers/reviewController')
const reviewsController = new reviewsControllerClass()
const authController = require('./../controllers/authController')

const reviewsRoute = express.Router({mergeParams:true})


///handling routes
//adding protect middleware to protect all the routes below
reviewsRoute.use(authController.protect)

reviewsRoute.route('/')
.get(reviewsController.getAllreviews)
.post(authController.restrictTo('user'),reviewsController.setTourUserIds,reviewsController.createReview)

reviewsRoute.route('/:id')
.delete(authController.restrictTo('admin','lead-guide'),reviewsController.deleteReview)
.patch(authController.restrictTo('admin','user'),reviewsController.updateReview)


module.exports = reviewsRoute


