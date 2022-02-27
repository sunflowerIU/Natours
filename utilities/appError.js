class AppError extends Error{
    constructor(message,statusCode){
        super(message)

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'Failed' : 'Error'
        this.isOperational = true;

        Error.captureStackTrace(this,this.constructor)  //this method gives a stack trace and consista of two params. (Error which is this in this context, and function that should not be shown when loggin stack trace)

    }
}

module.exports =  AppError