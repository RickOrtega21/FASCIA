import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'ricardoortega341@gmail.com',
        pass: 'tczp kfas kwir qkjl'
    }
});

const mailOptions = {
    from: '"FASCIA App" <ricardoortega341@gmail.com>',
    to: 'ricardoortega341@gmail.com',
    subject: 'prueba antigravity',
    text: 'test'
};

console.log('Sending test email...');
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('Error:', error);
    }
    console.log('Message sent: %s', info.messageId);
});
