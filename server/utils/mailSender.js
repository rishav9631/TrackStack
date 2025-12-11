const nodemailer = require('nodemailer');

const mailSender = async (email, title, body, attachments = []) => {
    try {
        // Create a Transporter to send emails
        let transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        // Send emails to users
        let info = await transporter.sendMail({
            from: 'Expense Tracker - Rishav Kumar',
            to: email,
            subject: title,
            html: body,
            attachments: attachments
        });
        console.log("Email info: ", info);
        return info;
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = mailSender;
