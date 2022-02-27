const User = require('./../model/userModel')
const catchAsyncError = require('./../utilities/catchAsync')
const jwt = require('jsonwebtoken') //json web token(jwt)
const AppError = require('./../utilities/appError')
const {
    promisify
} = require('util') ///import promisify from util(local module)

const Email = require('./../utilities/email') ///send email module
const crypto = require('crypto')






//making function for token
function signinToken(id) {
    return jwt.sign({
        id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}







///create and send token to all
const createSendToken = (user, statusCode, res) => {
    const token = signinToken(user._id)

    //options for cookie
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), //for expiry date
        httpOnly: true //will be secure and denies cross site scripting
        // secure: true, //will only work for https. we will only use this in production
    }


    //set cookieOptions.secure to true while in production
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;


    // sending jwt as cookie, cookie receives a string when server sends to client and it stores it, and cookie sends automatically jwt so server
    res.cookie('jwt', token, cookieOptions) //(stringName, stringThatWeWantToSend, options)

    //to hide the password from result
    user.password = undefined


    //send response
    res.status(statusCode).json({
        status: 'Success',
        token,
        data: {
            user
        }
    })
}


///for user signup
exports.signup = catchAsyncError(async (req, res, next) => {
    ///instead of using req.body directly, we will only take data that we specified below
    //so that others wont make themselves as admin , because when using req.body only they can directly make themselves as admin
    ///by sending admin in req.body

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    })
    // const newUser = await User.create(req.body)

    /////send welcome welcome email
    const url = `${req.protocol}://${req.get('host')}/me`; //http://127.0.0.1:1000/me where req.protocol is http or https and req.get('host') means hosting url
    await new Email(newUser, url).sendWelcome()

    //now implementing jwt for signing up user, where we will create a token and send it to user
    createSendToken(newUser, 201, res)

})




///now implementing login
exports.login = catchAsyncError(async (req, res, next) => {
    const {
        email,
        password
    } = req.body

    // 1. if there is not email or password send error message
    if (!email || !password) {
        return next(new AppError('Sorry Please provide Email and password', 400))
    }

    // 2. check if user exists and password is correct
    const user = await User.findOne({
        email
    }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) { ///correctPassword will be there in every document(user) as we specified them in model
        return next(new AppError("Incorrect email or password", 401))
    }

    //3.if everything is correct
    // const token = ''
    createSendToken(user, 200, res)
})




// now protecting the routes, example we dont want to give access to person who is not logged in
exports.protect = catchAsyncError(async (req, res, next) => {

    let token;

    //1. getting token and check if it is there?
    ///imp note: we have to pass the token in headers in postman to get the following results.
    //there is standard method to pass the jwt token that is name=Authorization and key=bearer tokenKey
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
        // console.log(token)

    } else if (req.cookies.jwt) { //in outside of postman we need token, so if there is no token in header.authorization then token will be in cookies.
        token = req.cookies.jwt
    }

    //2. if there is no token in request
    if (!token) {
        return next(new AppError('You are not logged in. Please log in', 401)) //401 is for unauthorized access
    }

    //3. verifying token
    //a. simpler way
    // const decoded =  jwt.verify(token, process.env.JWT_SECRET,(err,decode)=>{      
    //     console.log(decode)
    // })

    //b. other way
    const payload = promisify(jwt.verify) //promisify is used to create to replace the callback functions
    const decoded = await payload(token, process.env.JWT_SECRET)
    // console.log(decoded)


    ///4. check if user still exists or not
    ///if the user has been deleted, the person who will have token should not access the protected routes
    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user by this token does no longer exists.', 401))
    }

    // 5. if user has changed password after getting token
    if (currentUser.changedPasswordAfter(decoded.iat)) { //iat means issued at
        // console.log('asdasd')
        return next(new AppError('Sorry your password was changed recently. Please try Again', 401))
    }

    //grant access to protected routes
    req.user = currentUser

    //set current user to user in local, so that we can access them from our template
    res.locals.user = currentUser
    // console.log(req.user)
    next()
    ////all the error here are resolved in errorController. see there
})



///to make logout functionality
exports.logOut = (req, res, next) => {
    res.cookie('jwt', 'loggedOut', { //we will not send any token here we will replace token by just and random string
        expires: new Date(Date.now() + 10 * 1000), //and setting expiry date to 10 sec from now
        httpOnly: true
    });

    res.status(200).json({
        status: 'Success'
    })
}



// to check whether the user is loggend in or not
exports.isLoggedIn = async (req, res, next) => {

    if (req.cookies.jwt) { //if there is jwt token in cookies then only do it

        try {
            //1. verifying token

            const payload = promisify(jwt.verify) //promisify is used to create to replace the callback functions
            const decoded = await payload(req.cookies.jwt, process.env.JWT_SECRET)
            // console.log(decoded)


            ///2. check if user still exists or not
            ///if the user has been deleted, the person who will have token should not access the protected routes
            const currentUser = await User.findById(decoded.id)

            if (!currentUser) { //if not current user available the go to next middleware
                return next()
            }

            // 3. if user has changed password after getting token
            if (currentUser.changedPasswordAfter(decoded.iat)) { //iat means issued at
                // console.log('asdasd')
                return next() //if password has been changed then go to next middleware.
            }

            //set current user to user in local, so that we can access them from our template
            res.locals.user = currentUser //request.locals is the pl
            // console.log(req.user)
            return next()
            ////all the error here are resolved in errorController. see there
        } catch (err) {
            return next()
        }
    }
    next()
}








///implementing authorization where only few role can delete tour. i.e admin and lead-guide
// since middleware cannot pass the params so we will return middleware function inside a function
exports.restrictTo = (...roles) => { //roles is array ['admin','lead-guide']
    return (req, res, next) => { //returning middleware function because we cannot use arguments coming from function while invoking
        if (!roles.includes(req.user.role)) { //if current user doesnot have role which is specified in roles array
            // console.log(roles)
            return next(new AppError('Sorry You do not have permission to perform this action.', 501))
        }
        next()
    }
}




///implementing forgot password
exports.forgotPassword = catchAsyncError(async (req, res, next) => {

    //1. get user based on their POST email
    const user = await User.findOne({
        email: req.body.email
    })

    if (!user) {
        return next(new AppError('There\'s no user with that email address.', 404))
    }

    //2. generate random token
    const resetToken = user.createPasswordResetToken()
    await user.save({ //it is a function to save database
        validateBeforeSave: false
    })


    try {

        //3. send it to user's email
        //making reset url which contains complete url like https://localhost:1000/api/v1/users/resetPassword/8hasdfdddiuaiua88u3jd8383
        const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
        // const message = `Forgot Password? Please click on the link to reset your password. Otherwise ignore this mail. ${resetUrl}`
       
        
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Your Password reset token (valid for 10 min)',
        //     message

        // })


        //send email for password reset token
        await new Email(user, resetUrl).sendPasswordReset()



        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    } catch (err) {
        user.passwordResetToken = undefined //if there is some error sending email then set passwordResetToken to undefined
        user.passwordResetExpires = undefined //and set passwordResetExpires to undefined
        await user.save({ //it is a function to save database
            validateBeforeSave: false
        })

        return next(new AppError('There was something wrong sending email. Try again later!', 500))

    }
})





////implementing reset password
exports.resetPassword = catchAsyncError(async (req, res, next) => {

    //1. Get user based on their token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {
            $gte: Date.now() //find user with passwordResetExpires which is greater than current date. which means token has not expired
        }
    })

    //2. if token has not expired and if there is user, set the new password
    if (!user) {
        return next(new AppError('Invalid token or has expired', 400))
    }
    //set new password
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save();

    //3. update changePasswordAt property of user


    //4. log the user in send jwt
    createSendToken(user, 200, res)

})



///implementin update password, because user should able to update password without resetting it
//user must be logged in to use this
exports.updatePassword = catchAsyncError(async (req, res, next) => {
    try {
        //1. get user from collection
        const user = await User.findById(req.user.id).select('+password')


        //2. check if posted password is correct
        if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
            return next(new AppError('Incorrect current password.', 401))
        }

        //3. if so update password
        user.password = req.body.password
        user.passwordConfirm = req.body.passwordConfirm
        await user.save()
        // User.findByIdAndUpdate wont work because validators and pre save will only work on save, password should always be saved

        //4. log in user, send jwt
        createSendToken(user, 200, res)
    } catch (err) {
        return next(new AppError(err.message, 500))
    }
})