////this module is for importing all our data to mongodb database

const fs = require('fs')
const mongoose = require('mongoose') ///import module
const dotenv = require('dotenv') ///import module
const Tour = require('./../../model/tourModel')
const User = require('./../../model/userModel')
const Review = require('./../../model/reviewModel')

dotenv.config({
    path: `./../../config.env`
}) //config path for dotenv


//url for mongoose to connect
const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

//connect our cluster with that url with some other options
mongoose.connect(db).then(con => {
    // console.log(con.connections)
    console.log('connection success')
})

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'))
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'))
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'))


///now to import all tours data to our database
const importData = async function () {
    try {
        await Review.create(reviews,{validateBeforeSave:false})
        await Tour.create(tours)
        await User.create(users,{validateBeforeSave:false})
        console.log('Data successfully imported')
    } catch (err) {
        console.log(err)
    }
    process.exit()   ///process.exit() is a aggressive way to exit the node
}

///now to delete all data from our database
const deleteAllData = async function () {
    try {
        await Tour.deleteMany()
        await User.deleteMany()
        await Review.deleteMany()
        console.log('All data are successfully deleted')
    } catch (err) {
        console.log(err)
    }
    process.exit()
}


////process.argument show the array of argument that we pass in cli
//eg:- node import-dev-data.js  . here :- [node.exe, import-dev-data.js(location)]
 // we can also add other arguments by typing them at last. eg:- node import-dev-data.js --import
 //    here :- [node.exe, import-dev-data.js(location), '--import']
//   node ./dev-data/data/import-dev-data.js --delete ....use this when current location is on main directory
console.log(process.argv)  

//so if process.argv has a --import in it then importData() and delete data if it has '--delete
if (process.argv[2] === '--import') {
    importData()
} else if (process.argv[2] === '--delete') {
    deleteAllData()
}