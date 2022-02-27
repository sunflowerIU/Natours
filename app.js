const path = require('path') //path is builtin core module which will help to set path to given directory.
const express = require('express')
const app = express()
const morgan = require('morgan')
const rateLimit = require('express-rate-limit') //install express-rate-limit
const helmet = require('helmet') //for setting security http headers   npm i helmet
const mongoSanitize = require('express-mongo-sanitize') ///for data sanitization against noSql attack npm i express-mongo-sanitize
const xss = require('xss-clean')
const hpp = require('hpp') ///hpp(http parameter pollution)  npm i hpp
const cookieParser = require('cookie-parser')  //for parsing cookie
const compression = require('compression')

//app start
///we will need template  engine to send the data that we had made until now
//so we will use pug template engine
app.set('view engine', 'pug'); //to set the engine as pug engine
app.set('views', path.join('views')) ///to set views path into views folder



//1. to set security http header
app.use(helmet())


//cors error manager
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://127.0.0.1:1000")
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header("Access-Control-Allow-Headers", "Origin,Content-Type, Authorization,Accept, X-Requested-With")
    if(req.method==='OPTIONS'){
        res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE")
        return res.status(200).json({});
    }
    next()

})


//error handling
const AppError = require('./utilities/appError')
const globalErrorHandler = require('./controllers/errorController')



///importing routers 
const userRouter = require('./routes/usersRoute')
const toursRouter = require('./routes/toursRoute')
const reviewsRouter = require('./routes/reviewRoutes')
const viewRouter = require('./routes/viewRoutes') //routers for view
const bookingRouter = require('./routes/bookingRoutes')

// console.log(process.env.NODE_ENV)


///////GLOBAL MIDDLEWARE

//using middleware to load a static files. this is inbuild middleware method
// app.use(express.static(`${__dirname}/public`))
app.use(express.static(path.join(__dirname, 'public')))


///using morgan middleware
app.use(morgan('dev')) ////different method are available in morgan which gives the status of req


//2.  using rateLimiter to prevent from denialOfService(DOS) and bruteForceAttack
const limiter = rateLimit({
    max: 100, //what is the maximum limit of request
    windowMs: 60 * 60 * 1000, //in what time, this means maximum 100 reqs per 1 hour
    message: 'Too many request from this IP, Please try again in 1 hour.'
})

//since limiter is now a middleware we can use it app.use
app.use('/api', limiter) //now it will work for every url starts with api


//3. for body parser to read data from body into req.body
///for middleware
app.use(express.json({
    limit: '10kb'
})) ///when the req.body is larger than 10kb then the node will throw error.

app.use(cookieParser()) //justl like body parser it is a cookie parser



//4. data sanitization should be done after the data has been read, data sanitization is sanitization of code
//to protect against malicious codes

//4.1 Data sanitization against noSql query injection
app.use(mongoSanitize()) //this will filter all the dollar sign and dot sign in query so that mongo operator cant work


//4.2 Data sanitization against XSS (cross site scripting attack)
app.use(xss())


//4.3 Preventing parameter pollution, because when we two or more parameter at a same time then it will become error
// so using another middleware to prevent that error, then mongodb will only use last one parameter
app.use(hpp({ ///but the problem is we want to still use more than one parameter, so in that case we can whitelist some of the parameters
    whitelist: [
        'duration', 'rating', "ratingsAverage", "ratingsQuantity", "price", "maxGroupSize", "noOfWeeks", 'difficulty'
    ]
}))


app.use(compression())

/////5. checking headers
app.use((req, res, next) => {
    // console.log(req.headers)
    // console.log(req.cookies)   //to look for cookie in every request
    next()
})


///assigning  router for views
app.use('/', viewRouter)


//assigning new router to the toursRoute(for tours)
app.use('/api/v1/tours', toursRouter) ///assigning as middleware

/////////
///assigning new router to the userRoute(for users)
app.use('/api/v1/users', userRouter) ///when request hits that link then userRoute is invoked


///assigning new router to the reviewRouter
app.use('/api/v1/reviews', reviewsRouter)


//booking routes
app.use('/api/v1/bookings',bookingRouter)


//////now handling all the unhandled routes, we will use this middleware at last because we want to catch the route which has not been handled by previous middlewares
//here all means all https method which are get,post,patch,update etc, and * means for all urls
////creating simple error middleware
app.all('*', (req, res, next) => {
    //everything we keep inside the next it will recognize it as a error and it will directly send error to central error handler without 
    // sending error using appError with message and status code.

    next(new AppError('Page not found', 404))
})


////now using middleware to handle all the error in one central place, express has its own error handling middleware
app.use(globalErrorHandler)





///exporting app to server.js
module.exports = app