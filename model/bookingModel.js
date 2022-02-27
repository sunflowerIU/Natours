const mongoose = require('mongoose')
const Tour = require('./tourModel')
const User = require('./userModel')



const bookingSchema = new mongoose.Schema({
    tour:{
        type: mongoose.Schema.ObjectId,
        required:[true, 'Booking must belong to tour'],
        ref:'Tour'
    },
    user:{
        type: mongoose.Schema.ObjectId,
        required:[true, 'Booking must belong to user'],
        ref:'User'
    },
    price:{
        type:Number,
        require:[true, 'Booking must have price']
    },
    createdAt:{
        type:Date,
        default: Date.now()
    },
    paid:{
        type:Boolean,
        default:true
    }
})

//populate middleware
bookingSchema.pre(/^find/, function(next){
    this.populate('user').populate({
        path:'tour',
        select:'name'
    })

    next()
})



const Booking = mongoose.model('Booking', bookingSchema)

module.exports = Booking