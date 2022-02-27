const User = require('./../model/userModel')
const catchAsyncError = require('./../utilities/catchAsync')
const AppError = require('./../utilities/appError')
const handlerFactory = require('./handlerFactory')
const multer = require('multer') //multer to upload files
const sharp = require('sharp')



// //making multer storage so that we can upload file
// ///1. setting multer storage to keep photo directly to our storage
// const multerStorage = multer.diskStorage({

//     //1. set destination where the file is to be saved
//     ///destination will have a function with 3 params, file is file that we uploaded and cb is callback which will have 
//     //two arguments (error,fileDestination) , set error to null
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users')
//     },

//     //2. set filename so that, that name will be renamed and saved into our file
//     // file rename format: user-userId-currentTimeStamp = user-udasd67a8978shd-7766456567
//     //extension is the extension like jpeg,png etc
//     filename: (req, file, cb) => {
//         const extension = file.mimetype.split('/')[1]
//         cb(null, `user-${req.user.id}-${Date.now()}.${extension}`)
//     }
// })


////2. but we want to keep the photo in a memory (buffer), which can be later used in image processing called resizing.
const multerStorage = multer.memoryStorage()



//make a multer filter
//this filter is done to check whether the uploaded file is really a image. since mimetype always starts with image if
//the file is image. so we can use that here
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true) //true is set to say yes the file is image
    } else {
        cb(new AppError('Not an image, Please upload Image', 400), false)
    }
}



///now making ready to upload 
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})




//making middleware for multer upload
exports.uploadUserPhoto = upload.single('photo')



//resize photo after uploading them
exports.resizeUserPhoto = catchAsyncError(async (req, res, next) => {
    //if no photo file in request then goto next
    if (!req.file) return next()

    ///set a filename for photo into req.file.filename, because we need that filename when saving to mongodb
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    //using sharp to resize photo
    await sharp(req.file.buffer) //req.file.buffer is a memory where we have kept our photo during upload
        .resize(500, 500) //resize them to square
        .toFormat('jpeg') //always format them to jpeg
        .jpeg({
            quality: 90
        }) //and set quality to 90% to save memory
        .toFile(`public/img/users/${req.file.filename}`)

    next()
})



//Now making the filterObj function, which will filter the object
const filterObj = (obj, ...allowedFields) => {
    const newObject = {} //create a empty object

    Object.keys(obj).forEach(el => { //object.keys will make array of all keys,and loop over them with forEach
        if (allowedFields.includes(el)) { //if allowedFields array includes that name then put them to newObject
            newObject[el] = obj[el]
        }
    })

    return newObject;
}




/// 1. for users route handling
exports.getAllUsers = handlerFactory.getAll(User)


//  2. now for users to update their data like email, etc
exports.updateMe = catchAsyncError(async (req, res, next) => {
    // console.log(req.body)
    // console.log(req.file)
    //a. create error if user puts password in data
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('This route is not for password updates. Go to updateMyPassword.', 400))
    }

    //b. filter the body. because we dont want anyone to change their role, passwordChangedAt etc, so we must filter them
    const filteredBody = filterObj(req.body, 'email', 'name')

    //b.1 now to save that photo name to our database
    if (req.file) { //if there is photo in request i.e req.file, then in filteredBody sav that photo name 
        filteredBody.photo = req.file.filename;
    }


    //c. update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, { //( id , dataThatNeedToBeUpdated , someOptions )
        new: true,
        runValidators: true
    })

    res.status(200).json({
        status: 'Success',
        updatedUser

    })
})



//3. for deleting user account
exports.deleteMe = catchAsyncError(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { //( id , dataThatNeedToBeUpdated , someOptions )
        active: false
    });

    res.status(204).json({
        status: "success",
        data: null
    })
})


// 4. deleteUser
exports.deleteUser = handlerFactory.deleteOne(User)


// 5. updateUser that can only be done by admin
//note: do not update password with these
exports.updateUser = handlerFactory.updateOne(User)


//to replace req.user.id to req.params.id
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id
    next()
}


//6. get one user
exports.getUser = handlerFactory.getOne(User, false)


// 7. create one user
exports.createUser = handlerFactory.createOne(User)


//to check if the req body is empty or not
exports.checkReqBody = (req, res, next) => {
    if (Object.keys(req.body).length === 0) {
        return res.status(404).json({
            status: 'failed',
            description: 'Your input is empty'

        })
    }
    next()
}