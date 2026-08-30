const mongoose = require('mongoose');
const mailSender = require('../utils/mailSender');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60 * 5, // Automatically deleted after 5 minutes
    },
});

async function sendVerificationEmail(email, otp) {
    try {
        const mailResponse = await mailSender(
            email,
            "StackTrack - Password Reset OTP",
            `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #10B981; text-align: center;">Password Reset Request</h2>
                <p style="color: #555; font-size: 16px;">
                    Here is your One-Time Password (OTP) code to reset your password:
                </p>
                <div style="text-align: center; margin: 25px 0;">
                    <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #10B981; background-color: #ECFDF5; padding: 10px 25px; border-radius: 8px; border: 1px solid #10B981;">
                        ${otp}
                    </span>
                </div>
                <p style="color: #777; font-size: 14px;">
                    This OTP is valid for 5 minutes. If you did not request this password reset, please ignore this email.
                </p>
            </div>
            `
        );
        console.log("[OTP] Email response: ", mailResponse);
    } catch (error) {
        console.warn("[OTP] Email notification notice: ", error.message);
        // Do not throw so OTP document save succeeds
    }
}

otpSchema.pre("save", async function (next) {
    console.log(`[OTP] Generating OTP record for ${this.email}: ${this.otp}`);
    if (this.isNew) {
        try {
            await sendVerificationEmail(this.email, this.otp);
        } catch (err) {
            console.warn('[OTP] Failed to send email via transporter:', err.message);
        }
    }
    next();
});

module.exports = mongoose.model('OTP', otpSchema);
