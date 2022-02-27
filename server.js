const mongoose = require('mongoose') ///import module
const dotenv = require('dotenv') ///import module

// 2. undandled exception is error(rejection) from synchronous codes
process.on('uncaughtException', error => {
    console.log('UNHANDLED EXCEPTION, SHUTTING DOWN..')
    console.log(error)
    process.exit(1) //1 is for success

 
})



dotenv.config({
    path: `./config.env`
}) //config path for dotenv

const app = require('./app')


//url for mongoose to connect
const db = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD)

//connect our cluster with that url with some other options
//note useNewUrlParser,useCreateIndex,useFindAndModify are not supported and no longer required
// mongoose.connect(db, {
//     useNewUrlParser: true,
//     useCreateIndex: true,
//     useFindAndModify: false
// }).then(con => {
//     // console.log(con.connections)
//     console.log('connection success')
// })

mongoose.connect(db).then(con => {
    // console.log(con.connections)
    console.log('connection success')
})

// console.log(process.env)



///to listen
const port = 1000;
const server = app.listen(port, () => {
    console.log('server has started')
})

//1. unhandled rejection is error(rejection) from asynchronous codes
////handling unhaldled promise rejection is the errors when promises are rejected somwhere in our code so we have to handled them globally
//example:user failing to log their account etc
process.on('unhandledRejection', error => {
    console.log('UNHANDLED REJECTION, SHUTTING DOWN..')
    console.log(error)
    server.close(() => { ///server.close will close all the pending requests, which will have access to callback, and in callback we will exit the process
        process.exit(1) //1 is for success

    })
})




