////first install nodemailer. npm i nodemailer
const nodemailer = require('nodemailer')
const pug = require('pug')
const htmlToText = require('html-to-text')


//make class to send email
module.exports = class Email {
    constructor(user, url) {
        this.to = user.email;
        this.from = `Amit Tamang @ ${process.env.EMAIL_FROM}`;
        this.url = url;
        this.name = user.name.split(' ')[0];
    }

    //create transporter to send email
    createNewTransport() {
        if (process.env.NODE_ENV === 'production') { //if we are in production then send real email using sendGrid
            console.log('emailllllllll')
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                }
            })
        } else {
            ////currently we are using mailtrap for sending email, which will fake emails. which means our client will not get email,but will be trapped by mailtrap.

            return nodemailer.createTransport({ //if we are in development then send fake email using mailtrap
                host: process.env.EMAIL_HOST, ///type 'Gmail' for gmail.activate 'less secure app option' in gmail if we use gmail
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            })
        }
    }




    //send emails
    async send(template, subject) {

        //1. render pug template
        const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, { //with options(this options will be later available in pug template)
            firstName: this.name,
            url: this.url,
            subject
        })

        //2. define the email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject: subject,
            html,
            text: htmlToText.fromString(html)
        }

        //3. create transporter and send email
        console.log('await finish')
        await this.createNewTransport().sendMail(mailOptions)
    }


    //send welcome email
    async sendWelcome() {
        await this.send('welcome', `Dear ${this.name} welcome to Natours family`)
    }


    //send password reset token email
    async sendPasswordReset() {
        await this.send('passwordReset', 'Your password reset token. (Expires in 10 minutes)')
    }

}