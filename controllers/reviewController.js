const Review = require('../model/reviewModel')
const catchAsyncError = require('../utilities/catchAsync')
const handlerFactory = require('./handlerFactory')

module.exports = class {

    //1. get all reviews
    getAllreviews = handlerFactory.getAll(Review)


    
    //making middleware to set user ids and tour ids before creating reviews
    setTourUserIds = (req, res, next) => {
        if (!req.body.user) {
            req.body.user = req.user.id
        }
        // also
        if (!req.body.tour) {
            req.body.tour = req.params.tourId
        }
        next()
    }



    // 2. create review
    createReview = handlerFactory.createOne(Review)

    // 3. delete Review
    deleteReview = handlerFactory.deleteOne(Review)


    //4. update Review by admin
    updateReview = handlerFactory.updateOne(Review)
}