const Tour = require('./../model/tourModel') //Tour schema
const catchAsyncError = require('./../utilities/catchAsync')
const handlerFactory = require('./handlerFactory')
const AppError = require('./../utilities/appError')
const multer = require('multer')
const sharp = require('sharp')






////1. setting up multer 
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
exports.uploadImages = upload.fields([{
        name: 'imageCover',
        maxCount: 1
    },
    {
        name: 'images',
        maxCount: 3
    }
])

//resize photo and process them to database after uploading them
exports.resizeImages = catchAsyncError(async (req, res, next) => {
    //if no photo file in request then goto next
    if (!req.files.imageCover || !req.files.images) return next()

    ///set a filename for imageCover into req.body.imageCover, because we need that filename when saving to mongodb
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

    //1. for imageCover
    //using sharp to resize photo
    await sharp(req.files.imageCover[0].buffer) //req.file.buffer is a memory where we have kept our photo during upload
        .resize(2000, 1333) //resize them to square
        .toFormat('jpeg') //always format them to jpeg
        .jpeg({
            quality: 90
        }) //and set quality to 90% to save memory
        .toFile(`public/img/tours/${req.body.imageCover}`)


    //2. for images
    req.body.images = [];

    //because we ara making loop inside it and making an array so we will use promise.all to wait them all
    await Promise.all(req.files.images.map(async (image, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

        //then resize and process the image
        await sharp(image.buffer) //req.file.buffer is a memory where we have kept our photo during upload
            .resize(2000, 1333) //resize them to square
            .toFormat('jpeg') //always format them to jpeg
            .jpeg({
                quality: 90
            }) //and set quality to 90% to save memory
            .toFile(`public/img/tours/${filename}`)

        //then save the filename to req.body.images in each iteration
        req.body.images.push(filename)

    }));


    next()
})





///to get all tours   
///1. find method is used to get all tours
exports.getAllTours = handlerFactory.getAll(Tour)


//2. for creating tour
exports.createTour = handlerFactory.createOne(Tour)



//////3. get top 5 best cheap tours
exports.aliasTopTours = catchAsyncError(async (req, res, next) => {
    //we are prefilling our query so that user dont have to fill all these
    req.query.sort = '-ratingsAverage,price';
    req.query.limit = 5;
    req.query.fields = 'name,ratingsAverage,price,summary,difficulty'
    next()
})



///4. to get only one tours
//using findById . 
//this is available because we will put id in our url and mongodb database has alerady id in it
// Tour.findOne({_id:787jhndh823y})   :this is just like doing it
exports.getTour = handlerFactory.getOne(Tour, 'reviews')



//5. updating tour
exports.updateTour = handlerFactory.updateOne(Tour)




///6. deleting tour
exports.deleteTour = handlerFactory.deleteOne(Tour)




///7. using aggregation pipeline
exports.getTourStats = catchAsyncError(async (req, res, next) => {

    const stats = await Tour.aggregate([{
            $match: { ////match is used to match the result with following conditions
                ratingsAverage: { ///our results rating should be greater and equal than 4.5
                    $gte: 4.5
                }
            }
        },

        {
            $group: { //grouping is used as grouping the results data line by line
                // _id: '$difficulty',
                _id: { //id should be shown as difficulty in upperCase
                    $toUpper: '$difficulty'
                },
                numTours: { ///number of tours using sum operator
                    $sum: 1 //1 is used to add all of results
                },
                numRatings: {
                    $sum: '$ratingsQuantity'
                },
                avgRatings: {
                    $avg: '$ratingsAverage' ///avg is operator to calculate average
                },
                avgPrice: {
                    $avg: '$price'
                },
                minPrice: {
                    $min: '$price'
                },
                maxPrice: {
                    $max: '$price'
                }

            }

        },
        {
            $sort: { //we can also do sorting
                avgPrice: 1
            }
        },

        // {
        //     $match: {  //we can use match again which means we can do same things again
        //         _id: {
        //             $ne: 'EASY' //ne means not equal to , which means result will show all except easy
        //         }
        //     }
        // }

    ])

    //send response
    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

})


///8. get monthly plan 
exports.getMonthlyPlan = catchAsyncError(async (req, res, next) => {


        const year = +req.params.year
        const plan = await Tour.aggregate([{
                $unwind: '$startDates' ///unwind basically destructures the array and gives each element of array a separate element
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),
                    }
                }
            },
            {
                $group: {
                    _id: { //id is complusory
                        $month: '$startDates' ///month is a aggregation operator which extracts month from date
                    },
                    numOfToursStart: {
                        $sum: 1
                    },
                    toursName: {
                        $push: '$name' //push is aggregation operator that will push the data into a array. which means it forms array
                    },

                }
            },
            {
                $addFields: {
                    month: '$_id'
                }
            },
            {
                $project: { ///project is used for showing or hiding the following data into the results
                    _id: 0 //where 0 means hiding and 1 means showing, which means here _id will not be shown in results
                }
            },
            {
                $sort: {
                    numOfToursStart: -1 ///where -1 means descending order and 1 for ascending
                }
            },
            {
                $limit: 12 //limiting the result by 6. means only 6 results shows up
            }


        ])



        //sendig response
        res.status(200).json({
            status: 'success',
            data: {
                plan
            }
        })


    }

)



// 9. using geospatial queries to get tours within certain radius
exports.getToursWithin = catchAsyncError(async (req, res, next) => {
    const { //destructuring all the params
        latlng,
        distance,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(','); //destructuring latitude and longitude
    const radius = unit === 'km' ? distance / 6371 : distance / 3958.8; //we will need to find the radius to find the tours within specified distance, so we have to divide distance with radius of earth.

    if (!lat || !lng) { //show error if lat and lng are not specified
        next(new AppError('Please provide latitude and longitude in format.', 400))
    }

    const tours = await Tour.find({ //now find that tours using geospatial queries
        startLocation: {
            $geoWithin: {
                $centerSphere: [
                    [lng, lat], radius
                ]
            }
        }
    })

    // console.log(lat,lng,distance,unit)
    res.status(200).json({
        status: 'success',
        length: tours.length,
        data: {
            data: tours
        }
    })
})


//10. get distances of all tours
exports.getDistances = catchAsyncError(async (req, res, next) => {
    const { //destructuring all the params
        latlng,
        unit
    } = req.params;

    const [lat, lng] = latlng.split(','); //destructuring latitude and longitude
    const multiplier = unit === 'mi' ? 0.000621371 : 0.001


    if (!lat || !lng) { //show error if lat and lng are not specified
        next(new AppError('Please provide latitude and longitude in format.', 400))
    }

    //using aggregation pipeline to calculate the distances
    const distances = await Tour.aggregate([{
            $geoNear: { //geoNear should always be at first stage
                near: { //this is mandatory 
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1] //multiplying by one to convert str into number
                },
                distanceField: 'distance',
                distanceMultiplier: multiplier //multiplying distance by 0.001 which is like dividing distance with 1000 to convert distance to km if unit is set to km
            }

        },
        {
            $project: { //this operators helps to show only following data in result, where 1 means show following data in result
                distance: 1,
                name: 1
            }
        }
    ])


    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    })
})