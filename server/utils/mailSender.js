const nodemailer = require('nodemailer');
const axios = require('axios');
const { getConfigInternal } = require('../controllers/configController');

/**
 * Creates a base64url-encoded RFC 2822 raw email string for Gmail API.
 */
function createRawEmail(to, fromName, fromEmail, subject, htmlBody, attachments = []) {
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;

    if (!attachments || attachments.length === 0) {
        const messageParts = [
            `From: ${fromName} <${fromEmail}>`,
            `To: ${to}`,
            `Subject: ${utf8Subject}`,
            `MIME-Version: 1.0`,
            `Content-Type: text/html; charset=utf-8`,
            ``,
            htmlBody
        ];
        return Buffer.from(messageParts.join('\r\n'))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    // Multipart email with attachments
    const boundary = '===_NextPart_' + Date.now().toString(16);
    const messageParts = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        htmlBody,
    ];

    attachments.forEach((att) => {
        const filename = att.filename || 'attachment.pdf';
        const contentType = att.contentType || 'application/pdf';
        const contentBase64 = Buffer.isBuffer(att.content)
            ? att.content.toString('base64')
            : Buffer.from(att.content).toString('base64');

        messageParts.push(
            `--${boundary}`,
            `Content-Type: ${contentType}; name="${filename}"`,
            `Content-Disposition: attachment; filename="${filename}"`,
            `Content-Transfer-Encoding: base64`,
            ``,
            contentBase64
        );
    });

    messageParts.push(`--${boundary}--`);

    return Buffer.from(messageParts.join('\r\n'))
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

/**
 * Fetches a fresh OAuth2 access token using Gmail OAuth credentials.
 */
async function getGmailAccessToken(clientId, clientSecret, refreshToken) {
    const tokenRes = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        }
    );
    return tokenRes.data.access_token;
}

/**
 * Primary Unified Email Sender:
 * 1. Tries Gmail REST API (HTTPS port 443 — works everywhere without SMTP blocking)
 * 2. Falls back to Nodemailer SMTP
 */
const mailSender = async (email, title, body, attachments = []) => {
    let config = null;
    try {
        config = await getConfigInternal();
    } catch (_) {}

    const gmailClientId = (config && config.gmailClientId) || process.env.GMAIL_CLIENT_ID || '';
    const gmailClientSecret = (config && config.gmailClientSecret) || process.env.GMAIL_CLIENT_SECRET || '';
    const gmailRefreshToken = (config && config.gmailRefreshToken) || process.env.GMAIL_REFRESH_TOKEN || '';

    const mailUser = (config && config.mailUser) || process.env.MAIL_USER || 'rishavjha771@gmail.com';
    const mailHost = (config && config.mailHost) || process.env.MAIL_HOST || 'smtp.gmail.com';
    const mailPass = (config && config.mailPass) || process.env.MAIL_PASS || '';

    const senderEmail = mailUser || 'rishavjha771@gmail.com';
    const senderName = 'StackTrack - Rishav Kumar';

    console.log(`[MailSender] Sending email to: ${email} | Subject: "${title}"`);

    // ── METHOD 1: Gmail REST API (HTTPS Port 443) ────────────────────────────
    if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
        try {
            console.log('[MailSender] Attempting Gmail REST API (HTTPS)...');
            const accessToken = await getGmailAccessToken(gmailClientId, gmailClientSecret, gmailRefreshToken);
            const rawEmail = createRawEmail(email, senderName, senderEmail, title, body, attachments);

            const response = await axios.post(
                'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
                { raw: rawEmail },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000,
                }
            );

            console.log(`[MailSender] Email sent via Gmail REST API! Message ID: ${response.data?.id}`);
            return response.data;
        } catch (gmailErr) {
            console.warn(`[MailSender] Gmail REST API notice (${gmailErr.message}). Trying fallbacks...`);
        }
    }

    // ── METHOD 2: Resend API (HTTPS Port 443 — Instant Fallback) ─────────────
    const resendApiKey = (config && config.resendApiKey) || process.env.RESEND_API_KEY || '';
    if (resendApiKey) {
        try {
            console.log('[MailSender] Attempting Resend API (HTTPS)...');
            const response = await axios.post(
                'https://api.resend.com/emails',
                {
                    from: 'StackTrack <onboarding@resend.dev>',
                    to: [email],
                    subject: title,
                    html: body,
                    reply_to: senderEmail,
                },
                {
                    headers: {
                        Authorization: `Bearer ${resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 15000,
                }
            );
            console.log(`[MailSender] Email sent via Resend API! ID: ${response.data?.id}`);
            return response.data;
        } catch (resendErr) {
            console.warn(`[MailSender] Resend API notice: ${resendErr.message}`);
        }
    }

    // ── METHOD 3: Nodemailer SMTP Fallback ────────────────────────────────────
    try {
        console.log('[MailSender] Attempting SMTP Transporter...');
        const transporter = nodemailer.createTransport({
            host: mailHost,
            port: 587,
            secure: false,
            connectionTimeout: 5000,
            socketTimeout: 5000,
            auth: {
                user: mailUser,
                pass: mailPass,
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        const info = await transporter.sendMail({
            from: `"${senderName}" <${senderEmail}>`,
            to: email,
            subject: title,
            html: body,
            attachments: attachments,
        });

        console.log('[MailSender] Email sent via SMTP:', info.messageId);
        return info;
    } catch (smtpErr) {
        console.error('[MailSender] SMTP Transporter error:', smtpErr.message);
        throw new Error(`Failed to send email: ${smtpErr.message}`);
    }
};

module.exports = mailSender;
