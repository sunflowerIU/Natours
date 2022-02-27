const AppError = require('./../utilities/appError')



// 1. sending error when in producion
//when we send error we need to send minimum and understandable error to the client 
const sendProductionError = (err, req, res) => {
    //A. Error to be shown when we use through api (postman)
    if (req.originalUrl.startsWith('/api')) {
        // 1. when there is operational error like error in fetching data,wrong id input etc
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            })
        }
        //2. if error is not operational like programming error or any unknown error like third party api error
        else {
            // a. log the error to console
            console.log('Error:' + err)

            // b. send message
            return res.status(500).json({
                status: 'ERROR',
                message: 'OOPS, SOMETHING WENT WRONG!!!'
            })
        }
    }
    //B. error for rendered website
    // 1. when there is operational error like error in fetching data,wrong id input etc
    if (err.isOperational) {
        return res.status(err.statusCode).render('error',{
            title: 'OOPS, Something went wrong!!!',
            message: err.message
        })
    }
    //2. if error is not operational like programming error or any unknown error like third party api error
    else {
        console.log('Error:' + err)
        // b. send message
        return res.status(500).render('error',{
            title: 'OOPS, Something went wrong!!!',
            message: 'Please TRY AGAIN!!!'
        })
    }
}


// 2. sending error when in development
const sendDevelopmentError = (err, req, res) => {
    ///A. for api
    if (req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err,
            stack: err.stack
        })
    } else { ////B. for rendered website
        console.log('Error:' + err)
        return res.status(err.statusCode).render('error', {
            title: 'OOPS, Something went wrong!!!',
            message: err.message
        })
    }
}



/////// handling castError which comes from mongoDB
///cast error is a error when we input the id that mongodb cannot recognize. eg id = wwwwwwww
const handleCastError = err => {
    const message = `Invalid ${err.path}: ${err.value}`
    return new AppError(message, 400)
}



/////handling duplicates errors
////eg:when we want to keep the same name in our tours the error we receive will be unrecogized for client so lets make meaningful error message
const handleDuplicateError = err => {
    const message = `This name is already been defined. Choose another name`
    return new AppError(message, 400)
}



// handling validation error
const handleValidationError = err => {
    const errors = Object.values(err.errors).map(obj => obj.message)
    const message = `Invalid input data: ${errors.join('. ')}.`
    return new AppError(message, 400)
}

///handling jsonWebToken error
const handlerJWTError = () => {
    return new AppError('Invalid token. Please login again', 401)
}


//handling expired token error
const handlerJWTExpiredError = () => {
    return new AppError('Your token has been expired. Please login again', 401)
}

///error handling
module.exports = (err, req, res, next) => {
    // console.log(err.stack)     ///logs stack traces
    //it consists 4 parameters (error,req,res,next). if we use this 4 params then express automatically knows this is error handling middleware
    err.statusCode = err.statusCode || 500 //where 500 is internal server error
    err.status = err.status || 'Failed'

    ////when we send error we need to send minimum and understandable error to the client 
    if (process.env.NODE_ENV === 'production') {

        let error = {
            ...err
        }
        error.message = err.message
        // a. if there is error from mongodb like castError
        ///in case of castError
        if (err.name === 'CastError') {
            error = handleCastError(error)
        }

        ///b. error handling for making duplicates (eg:name)
        if (err.code === 11000) {
            error = handleDuplicateError(error)
        }

        //c.validation errors
        if (err.name === 'ValidationError') {
            error = handleValidationError(error)
        }

        //d. json web token error
        if (err.name === 'JsonWebTokenError') {
            error = handlerJWTError()
        }

        //e. json web token expired error
        if (err.name === 'TokenExpiredError') {
            error = handlerJWTExpiredError()
        }


        // b. if not then simply just send production error
        sendProductionError(error, req, res)

    }
    // and when we are in development then we need maximum error as possible to find that error
    else if (process.env.NODE_ENV === 'development') {
        sendDevelopmentError(err, req, res)
    }

}