const nodemailer = require('nodemailer');

/**
 * Create Nodemailer Transporter
 * Prioritizes Gmail App Password / SMTP config from environment variables.
 * Falls back gracefully in development mode if credentials are not configured.
 */
function createTransporter() {
    const rawUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
    const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

    if (rawUser && rawPass) {
        const cleanPass = rawPass.trim().replace(/\s+/g, '');
        return nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // Direct SSL on port 465 works reliably on cloud platforms like Railway
            auth: {
                user: rawUser,
                pass: cleanPass
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000
        });
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST.trim(),
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER.trim(),
                pass: (process.env.SMTP_PASS || '').trim()
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 15000
        });
    }

    // Fallback mode for local development testing
    return null;
}

/**
 * Send OTP Email to student, teacher, or officer
 */
const sendOTPEmail = async ({ toEmail, userName, userId, otp }) => {
    const transporter = createTransporter();

    const subject = `[Majuria Baispatra S.M High School] Password Reset OTP Code: ${otp}`;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; margin: 0; padding: 20px; color: #333; }
                .container { max-width: 550px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
                .header p { margin: 5px 0 0; font-size: 13px; opacity: 0.9; }
                .content { padding: 30px 25px; }
                .greeting { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 12px; }
                .text { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 20px; }
                .otp-box { background: #f0f7ff; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
                .otp-code { font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 8px; font-family: monospace; }
                .otp-expiry { font-size: 12px; color: #ef4444; font-weight: 600; margin-top: 8px; }
                .footer { background: #f8fafc; padding: 15px 25px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>MAJURIA BAISPATRA S.M HIGH SCHOOL</h1>
                    <p>Account Security & Password Reset</p>
                </div>
                <div class="content">
                    <div class="greeting">Hello ${userName || 'User'},</div>
                    <div class="text">
                        We received a request to reset your login password for User ID: <strong style="color: #1e3a8a; font-family: monospace;">${userId}</strong>.
                        Please use the One-Time Password (OTP) below to complete your password reset:
                    </div>
                    <div class="otp-box">
                        <div class="otp-code">${otp}</div>
                        <div class="otp-expiry">⏱️ Valid for 10 minutes only</div>
                    </div>
                    <div class="text" style="font-size: 13px; color: #64748b;">
                        If you did not request a password reset, please ignore this email or notify your school administrator immediately.
                    </div>
                </div>
                <div class="footer">
                    &copy; ${new Date().getFullYear()} Majuria Baispatra S.M High School Portal System. All rights reserved.
                </div>
            </div>
        </body>
        </html>
    `;

    console.log(`\n==================================================`);
    console.log(`🔑 PASSWORD RESET OTP GENERATED`);
    console.log(`👤 User ID: ${userId}`);
    console.log(`📧 Sent To: ${toEmail}`);
    console.log(`🔢 OTP Code: ${otp}`);
    console.log(`==================================================\n`);

    if (!transporter) {
        console.warn(`[EmailService Warning]: Gmail / SMTP credentials not configured in .env. Falling back to console OTP display.`);
        return {
            success: true,
            sent: false,
            message: 'OTP generated. SMTP credentials not set in server .env; OTP logged to console.',
            devOtp: otp
        };
    }

    try {
        const mailOptions = {
            from: `"Majuria Baispatra S.M High School" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@majpuriabaispatra.edu'}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent
        };

        // 15 second timeout race promise for cloud networks
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('SMTP connection timed out after 15 seconds')), 15000);
        });

        const info = await Promise.race([
            transporter.sendMail(mailOptions),
            timeoutPromise
        ]);

        console.log(`[EmailService Success] OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
        return {
            success: true,
            sent: true,
            messageId: info.messageId,
            devOtp: otp
        };
    } catch (err) {
        console.error('[EmailService Error] Failed to send email via SMTP/Gmail:', err.message);
        return {
            success: true,
            sent: false,
            message: `Failed to deliver email to ${toEmail}: ${err.message}. OTP logged to server console.`,
            devOtp: otp
        };
    }
};

module.exports = {
    sendOTPEmail
};
