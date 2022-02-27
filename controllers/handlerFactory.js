const catchAsyncError = require('./../utilities/catchAsync')
const AppError = require('./../utilities/appError')
const APIFeatures = require('./../utilities/apiFeatures')



//1. handler for deleting one tour,user,or reviews
exports.deleteOne = (model) => catchAsyncError(async (req, res, next) => {

    const document = await model.findByIdAndDelete(req.params.id)

    ////adding 404 error if the id is not valid
    if (!document) {
        return next(new AppError('No document found with that id', 404))
    }

    res.status(200).json({
        status: 'success. Following document has been deleted',
        data: {
            document
        }
    })



})



//2. handler for updating one tour,user,or reviews
exports.updateOne = (model) => catchAsyncError(async (req, res, next) => {

    ///the details of this callback(id name, new tour written in body, new should be kept so that we can send
    // the data is new and so that to send that data as response. so new is compulsory)
    //runValidators will update the schema each time we update new value
    const document = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true //will run validators again when updating
    })
    ////adding 404 error if the id is not valid
    if (!document) {
        return next(new AppError('No document found with that id', 404))
    }

    res.status(200).json({
        status: 'success',
        data: {
            document
        }
    })



})



//3. handler for creating one tour,user,or reviews or bookings
exports.createOne = model => catchAsyncError(async (req, res, next) => {

    //newer way
    const newDocument = await model.create(req.body); //create will automatically save the data to our mongodb database
    // console.log(req.body)
    res.status(201).json({
        status: "success",
        newDocument
    });


})


//4. handler for getting only one tour,reviews or user
exports.getOne = (model, populateOption) => catchAsyncError(async (req, res, next) => {

    //in this we have to scenarious, one with populate and another without populate,so we are implementing this logic where the is populate or not
    let query = await model.findById(req.params.id)

    if (populateOption) {
        query = query.populate(populateOption)
    }

    const document = await query

    ////adding 404 error if the id is not valid
    if (!document) {
        return next(new AppError('No documents found with that id', 404))
    }
    res.status(200).json({
        status: 'success',
        data: {
            document
        }
    })
})


// 5. handler for getting all reviews,user and tours
exports.getAll = model => catchAsyncError(async (req, res, next) => {

    //for implementing nested review
    //filter is like option that we can pass to get specific results
    let filter = {}

    //if request has tourId in params then we can use filter to find tour with that id
    if (req.params.tourId) {
        filter = {
            tour: req.params.tourId
        }
    }



    //. execute query
    const features = new APIFeatures(model.find(filter), req.query)
        .filter()
        .sort()
        .limiting()
        .pagination()
    // console.log(features.query)
    // const document = await features.query.explain()
    const document = await features.query

    //send response
    return res.status(200).json({
        status: 'success',
        length: document.length,
        data: {
            document
        }
    })


})