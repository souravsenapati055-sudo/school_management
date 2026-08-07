const nodemailer = require('nodemailer');

/**
 * Create Nodemailer Transporters
 * Forces IPv4 (family: 4) to prevent IPv6 DNS hangs on cloud platforms like Railway.
 * Provides both Port 465 (SSL) and Port 587 (STARTTLS) strategies for maximum reliability.
 */
function createTransporters() {
    const rawUser = process.env.GMAIL_USER ? process.env.GMAIL_USER.trim() : '';
    const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS;

    if (rawUser && rawPass) {
        const cleanPass = rawPass.trim().replace(/\s+/g, '');

        // Strategy 1: Port 465 Direct SSL with forced IPv4
        const primary = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: rawUser,
                pass: cleanPass
            },
            family: 4, // Forces IPv4 to bypass Railway IPv6 connection timeouts
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000
        });

        // Strategy 2: Port 587 STARTTLS with forced IPv4 (Fallback)
        const fallback = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: rawUser,
                pass: cleanPass
            },
            family: 4, // Forces IPv4 to bypass Railway IPv6 connection timeouts
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 8000
        });

        return { primary, fallback };
    }

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        const custom = nodemailer.createTransport({
            host: process.env.SMTP_HOST.trim(),
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER.trim(),
                pass: (process.env.SMTP_PASS || '').trim()
            },
            family: 4,
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000
        });
        return { primary: custom, fallback: null };
    }

    // Fallback mode for local development testing
    return null;
}

/**
 * Send OTP Email to student, teacher, or officer
 */
const sendOTPEmail = async ({ toEmail, userName, userId, otp }) => {
    const transporters = createTransporters();

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

    // Priority 0: Resend API (HTTPS Port 443 - Never blocked on Railway)
    if (process.env.RESEND_API_KEY) {
        try {
            console.log(`[EmailService] Attempting to send OTP via Resend HTTPS API...`);
            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Majuria Baispatra High School <onboarding@resend.dev>',
                    to: [toEmail],
                    subject: subject,
                    html: htmlContent
                })
            });
            const data = await resendRes.json();
            if (resendRes.ok) {
                console.log(`[EmailService Success] Resend email sent successfully! ID: ${data.id}`);
                return { success: true, sent: true, messageId: data.id, devOtp: otp };
            }
            if (!resendRes.ok) {
                console.warn(`[EmailService Warning] Resend API notice: ${JSON.stringify(data)}`);

                // If in Resend testing mode, only use Resend if recipient is owner email, otherwise fall through to SMTP/Brevo
                if (data && data.message && data.message.includes('only send testing emails')) {
                    const ownerMatch = data.message.match(/\(([^)]+)\)/);
                    const ownerEmail = (ownerMatch ? ownerMatch[1] : (process.env.GMAIL_USER || 'souravsenapati055@gmail.com')).toLowerCase().trim();

                    if (toEmail.toLowerCase().trim() === ownerEmail) {
                        // Recipient is the owner, try sending directly to owner
                        const retryResend = await fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                from: 'Majuria Baispatra High School <onboarding@resend.dev>',
                                to: [ownerEmail],
                                subject: subject,
                                html: htmlContent
                            })
                        });

                        const retryData = await retryResend.json();
                        if (retryResend.ok) {
                            console.log(`[EmailService Success] Resend sandbox email sent to owner ${ownerEmail}! ID: ${retryData.id}`);
                            return {
                                success: true,
                                sent: true,
                                messageId: retryData.id,
                                devOtp: otp,
                                message: `OTP sent successfully to registered email`
                            };
                        }
                    } else {
                        console.warn(`[EmailService Notice] Resend is in free testing mode and cannot deliver to target email (${toEmail}). Falling back to SMTP/Brevo delivery...`);
                    }
                }
            }
        } catch (rErr) {
            console.error(`[EmailService Error] Resend API failed: ${rErr.message}`);
        }
    }

    // Priority 0.5: Brevo API (HTTPS Port 443 - Never blocked on Railway)
    if (process.env.BREVO_API_KEY) {
        try {
            console.log(`[EmailService] Attempting to send OTP via Brevo HTTPS API...`);
            const senderEmail = process.env.GMAIL_USER || 'souravsenapati055@gmail.com';
            const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'api-key': process.env.BREVO_API_KEY.trim(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: 'Majuria Baispatra S.M High School', email: senderEmail },
                    to: [{ email: toEmail }],
                    subject: subject,
                    htmlContent: htmlContent
                })
            });
            const data = await brevoRes.json();
            if (brevoRes.ok) {
                console.log(`[EmailService Success] Brevo email sent successfully! MessageID: ${data.messageId}`);
                return { success: true, sent: true, messageId: data.messageId, devOtp: otp };
            }
            console.warn(`[EmailService Warning] Brevo API error: ${JSON.stringify(data)}`);
            if (data && (data.message || data.code)) {
                return {
                    success: true,
                    sent: false,
                    message: `Brevo Notice: ${data.message || data.code}`,
                    devOtp: otp
                };
            }
        } catch (bErr) {
            console.error(`[EmailService Error] Brevo API failed: ${bErr.message}`);
        }
    }

    if (!transporters) {
        console.warn(`[EmailService Warning]: Gmail / SMTP credentials not configured in .env. Falling back to console OTP display.`);
        return {
            success: true,
            sent: false,
            message: 'OTP generated. SMTP credentials not set in server .env; OTP logged to console.',
            devOtp: otp
        };
    }

    const mailOptions = {
        from: `"Majuria Baispatra S.M High School" <${process.env.GMAIL_USER || process.env.SMTP_USER || 'no-reply@majpuriabaispatra.edu'}>`,
        to: toEmail,
        subject: subject,
        html: htmlContent
    };

    // Attempt 1: Primary Transporter (Port 465 SSL, IPv4)
    try {
        console.log(`[EmailService] Attempting to send OTP via Primary SMTP (Port 465 SSL, IPv4)...`);
        const info = await transporters.primary.sendMail(mailOptions);
        console.log(`[EmailService Success] OTP email sent successfully to ${toEmail}. Message ID: ${info.messageId}`);
        return {
            success: true,
            sent: true,
            messageId: info.messageId,
            devOtp: otp
        };
    } catch (primaryErr) {
        console.warn(`[EmailService Warning] Primary SMTP (Port 465) failed: ${primaryErr.message}. Trying Fallback SMTP...`);

        // Attempt 2: Fallback Transporter (Port 587 STARTTLS, IPv4)
        if (transporters.fallback) {
            try {
                console.log(`[EmailService] Attempting to send OTP via Fallback SMTP (Port 587 STARTTLS, IPv4)...`);
                const info = await transporters.fallback.sendMail(mailOptions);
                console.log(`[EmailService Success] OTP email sent successfully to ${toEmail} via fallback. Message ID: ${info.messageId}`);
                return {
                    success: true,
                    sent: true,
                    messageId: info.messageId,
                    devOtp: otp
                };
            } catch (fallbackErr) {
                console.error(`[EmailService Error] Both Primary and Fallback SMTP failed: ${fallbackErr.message}`);
                return {
                    success: true,
                    sent: false,
                    message: `Failed to deliver email to ${toEmail}: Railway network blocks outbound SMTP (ports 465/587). Add a RESEND_API_KEY or BREVO_API_KEY variable in Railway for HTTPS delivery. OTP logged to server console.`,
                    devOtp: otp
                };
            }
        }

        return {
            success: true,
            sent: false,
            message: `Failed to deliver email to ${toEmail}: ${primaryErr.message}. OTP logged to server console.`,
            devOtp: otp
        };
    }
};

module.exports = {
    sendOTPEmail
};
