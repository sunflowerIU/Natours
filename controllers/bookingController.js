const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('./../model/tourModel') //Tour schema
const Booking = require('./../model/bookingModel') //booking schema
const catchAsyncError = require('./../utilities/catchAsync')
const handlerFactory = require('./handlerFactory')
const AppError = require('./../utilities/appError')





//controller to get checkout session
exports.getCheckoutSession = catchAsyncError(async (req, res, next) => {

    //1. Get currently booked tour
    const tour = await Tour.findById(req.params.tourId)


    //2. create stripe checkout session
    const session = await stripe.checkout.sessions.create({
        //a. information about session

        payment_method_types: ['card'],
        // mode: 'payment',
        // success_url : `${req.protocol}://${req.get('host')}/`,
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId, //this is a custom field which we will use later

        //information about product
        line_items: [ ///these are options to be send in session, where we will access it later
            {
                name: `${tour.name} Tour`,
                description: tour.summary,
                images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                amount: tour.price * 100,
                currency: 'usd',
                quantity: 1
            }
        ]


    })


    //3. send session as response
    res.status(200).json({
        status: 'success',
        session
    })

})


///we will create booking only if we have user,price and tourId in success url
//this is onl;y temporary because it is unsecure
exports.createBookingCheckout = catchAsyncError(async (req, res, next) => {
    try {
        const {
            user,
            tour,
            price
        } = req.query

        ///if not uswr, tourId and price then go to next 
        if (!user && !tour && !price) {
            // console.log('noo anything')
            return next()
        }
        console.log(user, tour, price)
        // console.log('checking')
        ///create booking in database
        await Booking.create({user,tour,price})

        //then redirect the page int original page without query string
        res.redirect(req.originalUrl.split('?')[0])

        
    } catch (err) {
        console.log(err)
    }
})



////for booking api

//1 create new booking
exports.createBooking = handlerFactory.createOne(Booking) 



//2 get my bookings
exports.getAllBookings = handlerFactory.getAll(Booking)


//3. get booking
exports.getBooking = handlerFactory.getOne(Booking)


//4. delete booking
exports.deleteBooking = handlerFactory.deleteOne(Booking)


//5. update booking
exports.updateBooking = handlerFactory.updateOne(Booking)
