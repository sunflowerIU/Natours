const express = require('express')

const userController = require('./../controllers/userController')
const authController = require('./../controllers/authController')

const userRoute = express.Router()

///here two middleware in post and patch means ,  first execute 1st middleware and execute 2nd middleware which is called
// chaining middlewares
//for user authentication
userRoute.post('/signup',authController.signup)
userRoute.post('/login',authController.login)
userRoute.post('/forgotPassword',authController.forgotPassword)
userRoute.patch('/resetPassword/:token',authController.resetPassword)
//logout page route
userRoute.get('/logout',authController.logOut)
//update my data(email,name)
// userRoute.patch('/updateMe',authController.protect,viewController.updateMe)
// update my password
userRoute.patch('/updateMyPassword',authController.protect,authController.updatePassword)

//now use protect middleware here so that it can protect all of them below it. and we can remove protect handler 
// from all routes below it.
userRoute.use(authController.protect)

userRoute.patch('/updateMyPassword',authController.updatePassword)
userRoute.patch('/updateMe',userController.uploadUserPhoto,userController.resizeUserPhoto,userController.updateMe) //now first uploaded photo will be saved only then user will be updated
userRoute.delete('/deleteMe',userController.deleteMe)
userRoute.route('/me').get(userController.getMe,userController.getUser)


userRoute.use(authController.restrictTo('admin'))
userRoute.route('/').get(userController.getAllUsers).post(userController.createUser)
userRoute.route('/:id').delete(userController.deleteUser)
userRoute.route('/:id').patch(userController.updateUser)
userRoute.route('/:id').get(userController.getUser)




module.exports = userRoute 