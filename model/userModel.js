const mongoose = require('mongoose') ///importing mongoose
const validator = require('validator') //external validator
const bcrypt = require('bcryptjs') //installing bcrypt
const crypto = require('crypto') //it is for creating random bytes which is build in when installing bcrypt


///same like schema for tours lets build schema for user
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Your name is required'],
        trim: true,
        // validators
        maxLength: [15, 'Name should have maximum 15 character']
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true, //it will convert email into lowerCase
        validate: [validator.isEmail, 'Please provide valid Email'] //custom validator from documentation to check for valid emails
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must have 8 character'],
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Password is required'],
        minLength: [8, 'Password must have 8 character'],
        validate: {
            //using custom validator to check the confirmed password and password are same
            //note : this works only on save and create
            validator: function (el) {
                return this.password === el
            },
            message: 'Confirm password doesnot match your password'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: { //so that if the user is active or not
        type: Boolean,
        default: true,
        select: false
    }
})


///now we need to first encrypt our password before saving it to database . so we will use middleware to do it
///we will use bcrypt js to do it . use npm i bcryptjs
userSchema.pre('save', async function (next) {
    // we will only encrypt if password is modified, example if user only updates his email then we will not encrypt
    if (!this.isModified('password')) return next();

    //encrypting the password to hash, where 10 is value for encryption, the more that value will be the more it will be cpu intensive and difficlut to crack
    this.password = await bcrypt.hash(this.password, 8) //since bcrypt.hash is synchronous so we need to make it asynchronous by making it asynchronous
    this.passwordConfirm = undefined //because we dont need that passwordConfirm to so in our database
})



// making middleware that will save the passwordChangedAt to current time
userSchema.pre('save', function (next) {
    //if the password has not been modified and the user is new then simply run next middleware
    if (!this.isModified('password') || this.isNew) return next();

    //if the password has changed then set passwordChangedAt to current time, with -2 sec, because it takes time to make jwt , so this middleware would run after making jwt
    this.passwordChangedAt = Date.now() - 2000;
    next()
})



/////for comparing the new password whcih comes from request by candidate and password that is saved in database
//in database we have already saved password into hash and there is no way of getting that back 
// we can compare them by making candidate password into hash again
//we will create a instance method in schema which will then available to all document
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}


////now making instance method if the user has changed password
userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
    if (this.passwordChangedAt) {
        ///this.passwordChangedAt is date(2020-10-10) available in user because i entry that during making the user
        ///it is then changed into number in ms which is then changed into seconds and converted to integer with base10
        const passwordChangedAt = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
        // console.log(passwordChangedAt, JWTTimeStamp)

        return passwordChangedAt > JWTTimeStamp //suppose password changed at 200s(js date) and token decoded at 100s then password was changed after token was decoded which will be true
    } //where true is changed and false is not changed
    //where false is not changed(password)
    return false;
}


///making instance method for creating random token by crypto to send to user's email for password reset
userSchema.methods.createPasswordResetToken = function () {

    //1. this is a resetToken which will be sent to user's email which is not being encrypted
    const resetToken = crypto.randomBytes(32).toString('hex')

    //2. this is a encrypted passwordResetToken which we will save it to database
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    //3. this is time when password reset expires
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000 //passwordResetExpires Time

    console.log({
        resetToken
    }, this.passwordResetToken)
    return resetToken
}




////middleware to only find the user which are active:true
userSchema.pre(/^find/, function (next) {
    //    /^find/ will work for any query that starts with find, eg:findAllTours,findByIdAndUpdate etc...
    this.find({
        active: {
            $ne: false
        }
    }); //this refers to current query
    next()
})


const User = mongoose.model('User', userSchema)

module.exports = User