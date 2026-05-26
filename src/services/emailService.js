const nodemailer = require("nodemailer");

// Simple email transporter using console (works without configuration)
let transporter = null;

// Initialize - use ethereal for testing (no config needed)
const initTransporter = async () => {
    try {
        // Create ethereal test account (works immediately, no setup)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("✅ Email transporter ready (Ethereal - Test Mode)");
        console.log(`📧 Test email preview URL will appear in console when emails are sent`);
        return true;
    } catch (error) {
        console.error("❌ Email init error:", error.message);
        transporter = null;
        return false;
    }
};

// Call init
initTransporter();

// Send welcome email to school admin
exports.sendSchoolWelcomeEmail = async (email, name, schoolName, schoolCode, password) => {
    try {
        if (!transporter) {
            // Fallback: log to console
            console.log("\n" + "=".repeat(60));
            console.log(`📧 WELCOME EMAIL (would be sent to: ${email})`);
            console.log("=".repeat(60));
            console.log(`School Name: ${schoolName}`);
            console.log(`School Code: ${schoolCode}`);
            console.log(`Admin Email: ${email}`);
            console.log(`Admin Password: ${password}`);
            console.log(`Login URL: ${process.env.FRONTEND_URL || "http://localhost:5173"}`);
            console.log("=".repeat(60) + "\n");
            return true;
        }

        const mailOptions = {
            from: `"School Inventory System" <${process.env.EMAIL_USER || "noreply@schoolinventory.com"}>`,
            to: email,
            subject: `🏫 Welcome to ${schoolName} - Your School Account`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; border-radius: 10px;">
                    <div style="background-color: #1e3a5f; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">🏫 School Inventory System</h1>
                    </div>
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1e3a5f;">Hello ${name}!</h2>
                        <p>Your school <strong>${schoolName}</strong> has been successfully registered.</p>
                        
                        <div style="background-color: #e8f4e8; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="margin: 0 0 10px 0; color: #2e7d32;">🏫 Your Login Credentials</h3>
                            <p><strong>School Code:</strong> <span style="font-size: 18px; font-weight: bold;">${schoolCode}</span></p>
                            <p><strong>Email:</strong> ${email}</p>
                            <p><strong>Password:</strong> <span style="font-size: 16px; font-weight: bold;">${password}</span></p>
                        </div>
                        
                        <div style="background-color: #fff3e0; padding: 12px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 13px;">💡 <strong>Important:</strong> Please change your password after first login.</p>
                            <p style="margin: 5px 0 0; font-size: 13px;">🔑 Share the school code with other staff members to join your school.</p>
                        </div>
                        
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="display: inline-block; background-color: #1e3a5f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin-top: 20px;">Go to Login</a>
                        
                        <hr style="border-top: 1px solid #e5e7eb; margin: 20px 0;">
                        <p style="color: #888; font-size: 12px; text-align: center;">This is an automated message. Please do not reply.</p>
                    </div>
                </div>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome email sent to ${email}`);
        if (info.messageId) {
            console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }
        return true;
    } catch (error) {
        console.error("❌ Welcome email error:", error.message);
        // Log to console as fallback
        console.log("\n" + "=".repeat(60));
        console.log(`📧 WELCOME EMAIL (would be sent to: ${email})`);
        console.log("=".repeat(60));
        console.log(`School Name: ${schoolName}`);
        console.log(`School Code: ${schoolCode}`);
        console.log(`Admin Email: ${email}`);
        console.log(`Admin Password: ${password}`);
        console.log("=".repeat(60) + "\n");
        return false;
    }
};