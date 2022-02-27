const mongoose = require('mongoose') ///import module
const validator = require('validator') //external validator
// const User = require('./userModel') //requiring user model     ///not necessary for referencing
const slugify = require('slugify')

/////////making a simple schema
//schema is like a blueprint to build
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'The name of tour is required'],
        unique: true,
        trim: true, //will remove all the white space in the beginning and end of string
        //validators
        minLength: [5, 'The minimum length should be 10'],
        maxLength: [20, 'The maximum length should be 10'],
        //external validators
        // validate:[validator.isAlpha,'A tour name must be aplhabetic']
    },
    rating: {
        type: Number,
        default: 4.5 ///if we dont specify rating
    },
    price: {
        type: Number,
        required: [true, 'Price is required']
    },

    ratingsAverage: {
        type: Number,
        default: 4.4,
        //validators
        min: [1, 'Minimum rating should be 1'],
        max: [5, 'Maximum rating should be 5'],
        set: val => Math.round(val * 10) / 10   //set is feature that that will be executed whenever the value is set into it. it accepts callback function with value. i.e 4.511 -> 4.5 and 4.566->4.6
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        required: [true, 'A tour must have durations']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have group size']
    },
    slug:String,
    difficulty: {
        type: String,
        required: [true, 'A tour must have difficulty'],
        // validators to set only three of difficulties
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty must be easy, medium or difficult'
        }
    },
    ///using custom validators in this discount price
    //remember custom validator should always give us a boolean value
    priceDiscount: {
        type: Number,
        validate: {
            ///this keyword will only work on when creating a new document, it doesnot work on old ones when updating documents
            validator: function (el) {
                return this.price > el
            },
            message: 'The price must be greater than discount price {VALUE}' //here {VALUE} is just a internal features of mongoDb, which will get access to value that has been entered.
        }
    },
    summary: {
        type: String,
        trim: true, //will remove all the white space in the beginning and end of string
        required: [true, 'A tour must have summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have image cover']

    },
    images: [String], //array of string
    createdAt: {
        type: Date,
        default: Date.now(), //Date.now() will give a millisecond of till now but mongo will automaticallly convert it to date
        select: false ///if select is set to false then we cannot show this in fields. it means it will never accessed through api calls 
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // geoJson is used to specify geospatial data. google for geoJson mongoose
        type: {
            type: String,
            default: 'Point', //must be point for point schema
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [{
        // to make it into a document we have to keep it inside a array
        type: {
            type: String,
            default: 'Point', //must be point for point schema
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number
    }],
    guides: [{ ///this is a way for referencing in mongoose.
        type: mongoose.Schema.ObjectId, //it means the type should be like objectId of mongoose
        ref: 'User' ///this is required to automatically referencing
    }]

}, { ///options for schema
    toJSON: {
        virtuals: true
    },
    toObject: {
        virtuals: true
    } ///required for virtual to show up in output
})


/////middlewares
//slugifying the name for url later
tourSchema.pre('save',function(next){
    this.slug = slugify(this.name,{
        lower:true,
        replacement:'-'
    })
    next()
})


///adding index for tour schema for prices
// tourSchema.index({price:1}) //this is for single index
tourSchema.index({price:1,ratingsAverage:-1})// where positive 1 means ascending order and negative 1 means descending order
tourSchema.index({slug:1})
tourSchema.index({startLocation:'2dsphere'})

////adding virtuals . virtuals are those property which helps in computing documents but will not be added stored in mongodb
tourSchema.virtual('noOfWeeks').get(function () {
    return Math.round(this.duration / 7)
})


//////using middleware on mongoose
//using virtual populate so that we can see all the reviews of certain tour
tourSchema.virtual('reviews', { //to connect between tour and reviews following options are used
    ref: 'reviews', //take reference from reviews
    foreignField: 'tour', //it means the field name which is located in another model
    localField: '_id' ///local field means which is located in current model
})




//query middleware for populating
tourSchema.pre(/^find/, function (next) {
    this.populate({ //this refers to current query that starts with find
        path: 'guides', ///path mean that has to be populated
        select: '-__v -passwordChangedAt' ///note minus sign denotes that we dont want that thing to be in result
    })
    next()
})


//3. AGGREGATION PIPELINE
///same as other middleware it will also work as same. we can add pre aggregation to filter aggregtion
// tourSchema.pre('aggregate', function (next) {
//     // console.log(this.pipeline())    ///this.pipeline() is same object that we specified in controller
//     this.pipeline().unshift({
//         $match: {
//             secretTour: {
//                 $ne: true
//             }
//         }
//     }) //pushing aggregation in pipeline which  is same aggregation we provided at controller
//     next();
// })



const Tour = mongoose.model('Tour', tourSchema)




module.exports = Tour;
// console.log(Tour)