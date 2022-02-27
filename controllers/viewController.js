const Tour = require('./../model/tourModel')
const catchAsyncError = require('./../utilities/catchAsync')
const AppError = require('../utilities/appError')
const User = require('./../model/userModel')
const Booking = require('./../model/bookingModel')




//1. function to load overview 
exports.getOverview = catchAsyncError(async (req, res, next) => {
    // 1. get data from tour model
    const tours = await Tour.find()
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    })
})


//2. function to load tour detail
exports.getTour = catchAsyncError(async (req, res, next) => {
    // 1. Get data, for requested tour with reviews and guides
    const tourSlug = req.params.slug
    const tour = await Tour.findOne({
        slug: tourSlug
    }).populate({
        path: 'reviews',
        fields: 'rating review user'
    })

    // if tour is not found then send this error message
    if (!tour) {
        return next(new AppError('Sorry could not found that tour!', 404))
    }
    // console.log(tour)
    // 2. Build template in views
    // 3. render template
    res.status(200).render('tour', {
        title: `${tour.name} Tour`,
        tour
    })
})


//3. make controller for login page
exports.getLoginForm = (req, res) => {
    res.status(200).render('login', {
        title: 'Log into your account'
    })
}


//4. make my Account controller
exports.getMyAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'My Account'
    })
}


//5. update my user data
exports.updateMe = catchAsyncError(async (req, res, next) => {
    try {
        const updatedUserData = await User.findByIdAndUpdate(req.user.id, {
            name: req.body.name,
            email: req.body.email
        }, {
            new: true,
            runValidators: true
        })
        // console.log(req.body.name,req.body.email)
        // console.log(updatedUserData, 'updated')
        res.status(200).render('account', {
            title: 'My Account',
            user: updatedUserData
        })
    } catch (err) {
        // console.log(err.message)
        return next(new AppError(err.message, 500))
    }
})



// 6. get my tours controller
exports.getMyTours = catchAsyncError(async (req, res, next) => {
try { //1. first find the bookings
    // console.log(req.user.id)
    const bookings = await Booking.find({
        user: req.user.id
    })

    // 2. then find tours and return ids
    const tourIds = bookings.map(el => el.tour) ///get tour id
    const tours = await Tour.find({
        _id: {
            $in: tourIds
        }
    }) //using in operator, which will find all tours with _id which are in tourIds\


    //sending response, and using same template overview by passing only booked tours
    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })
} catch (err) {

    // console.log(err)
    next()
}


})