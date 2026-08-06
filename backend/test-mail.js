require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailSender');

async function test() {
    console.log('Testing sendOTPEmail with GMAIL_USER:', process.env.GMAIL_USER);
    const res = await sendOTPEmail({
        toEmail: 'souravsenapati055@gmail.com',
        userName: 'SOURAV SENAPATI',
        userId: 'SOURAV849',
        otp: '998877'
    });
    console.log('Result:', res);
}

test();
