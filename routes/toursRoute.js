const express = require('express')
const toursController = require('./../controllers/tourController')
const authController = require('./../controllers/authController')
const reviewRouter = require('./reviewRoutes')

const toursRoute = express.Router()

////using middleware params
//in this method we get another parameter called val which is value of id
// toursRoute.param('id',(req,res,next,val)=>{
// console.log(`ID is ${val}`)
// next()
// })


//implementing user route to get reviews of tour using 'use'. it means whenever this type of url is encountered then
//use reviewRouter
toursRoute.use('/:tourId/reviews', reviewRouter)



//making router for aggregation pipeline
toursRoute.route('/tour-stats').get(toursController.getTourStats)

//making route for get monthly plans
toursRoute.route('/monthly-plans/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), toursController.getMonthlyPlan)


///making a aliasing api for top 5 best tour
toursRoute.route('/top-5-cheap')
    .get(toursController.aliasTopTours, toursController.getAllTours)


toursRoute.route('/')
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), toursController.createTour)
    .get(toursController.getAllTours)

// toursRoute.route('/').get(toursController.getAllTours).post(toursController.postTour)
toursRoute.route('/:id')
    .get(toursController.getTour)
    .patch(authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        toursController.uploadImages,
        toursController.resizeImages,
        toursController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), toursController.deleteTour)


///using geospatial queries
//this url looks like /tours-within/200/center/10.11,-11.22/mi
//where distance,latlng and unit are params
toursRoute.route('/tours-within/:distance/center/:latlng/unit/:unit').get(toursController.getToursWithin)

//using aggregation pipelines to calculate the distances of all tours from our current location
toursRoute.route('/distances/:latlng/unit/:unit').get(toursController.getDistances)




module.exports = toursRoute;