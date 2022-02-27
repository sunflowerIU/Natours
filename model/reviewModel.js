const mongoose = require('mongoose')
const Tour = require('./tourModel')

//building schema for review
const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Reviews cannot be empty'],
        trim: true
    },
    rating: {
        type: Number,
        max: 5,
        min: 1
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    tour: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    }],
    user: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }]
}, {
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    }
})


////using index for reviews 
reviewSchema.index({
    tour: 1,
    user: 1
}, {
    unique: true
});



////pre hooks to populate the tour
reviewSchema.pre(/^find/, function (next) {
    // this.populate({  ////removing this populate because uits not necessary now
    //     path: 'tour',
    //     select: 'name'
    // }).populate({ //pre hooks to popuate the user. if two populate is necessary then we can do it like this
    //     path: 'user',
    //     select: 'name photo'  //dont use minus sign here, because minus sign means we dont want to show them in result
    // })

    this.populate({ //pre hooks to popuate the user. if two populate is necessary then we can do it like this
        path: 'user',
        select: 'name photo' //dont use minus sign here, because minus sign means we dont want to show them in result
    })
    next()
})


///makingaggregation pipeline for avgRatings(making statics function inside the schema)
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // console.log(tourId)
    const stats = await this.aggregate([{
            $match: {
                tour: tourId
            }
        },
        {
            $group: {
                _id: '$tour',
                nRating: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                }
            }
        }
    ])


    //send response
    // res.status(200).json({
    //     status:'success',
    //     data:stats
    // })


    if (stats.length > 0) { //only execute when there is some data inside stats
        await Tour.findByIdAndUpdate(tourId, { //to update into database
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating
        })

    } else {
        await Tour.findByIdAndUpdate(tourId, { //to update into database
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        })

    }
}

//this is only after saving the doc, but doesnot work when we update and delete the review 
reviewSchema.post('save', function () { //post hook doesnot needs next
    //this points to current review
    // console.log(this.tour)
    this.constructor.calcAverageRatings(this.tour) //we will use constructor here because this wont be available when we read the code line by line
})


/////to calculate the ratingsAverage when we update and delete reviews
// 1.. to calculate the average ratings when we update and delete the reviews,get that current tour  first
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.doc = await this.findOne().clone() //mongoose newer version doesnot allows to duplicate query so we have to use .clone()
    // console.log(this.doc)
    this.doc.constructor.calcAverageRatings(this.doc.tour)

    next()
})


//2.. now calculate the averageRatings after the schema has been saved
reviewSchema.post('save', async function () {
    if (this.doc) {
        await this.doc.constructor.calcAverageRatings(this.doc.tour)
    }
    return
})





//for exporting schema
const review = mongoose.model('reviews', reviewSchema)

module.exports = review