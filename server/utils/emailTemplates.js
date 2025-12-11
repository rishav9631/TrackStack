exports.loginTemplate = (name) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #4CAF50; text-align: center;">Welcome Back, ${name}!</h2>
        <p style="color: #555; font-size: 16px;">
            You have successfully logged in to your Expense Tracker account. We are glad to see you again!
        </p>
        <p style="color: #555; font-size: 16px;">
            Track your expenses, manage your budget, and stay on top of your finances.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://expensetracker-hosting.vercel.app/" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
            If this wasn't you, please contact support immediately.
        </p>
    </div>
    `;
};

exports.signupTemplate = (name, verificationLink) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #2196F3; text-align: center;">Welcome to Expense Tracker, ${name}!</h2>
        <p style="color: #555; font-size: 16px;">
            Thank you for signing up. Please verify your email address to get started.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="${verificationLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        <p style="color: #555; font-size: 16px; margin-top: 20px;">
            Or copy and paste this link into your browser:
        </p>
        <p style="color: #2196F3; word-break: break-all;">${verificationLink}</p>
    </div>
    `;
};

exports.reportTemplate = (name, startDate, endDate) => {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #673AB7; text-align: center;">Your Expense Report</h2>
        <p style="color: #555; font-size: 16px;">
            Hello ${name},
        </p>
        <p style="color: #555; font-size: 16px;">
            Here is your requested expense report for the period <strong>${startDate}</strong> to <strong>${endDate}</strong>.
        </p>
        <p style="color: #555; font-size: 16px;">
            Please find the PDF report attached to this email.
        </p>
        <div style="text-align: center; margin-top: 30px;">
            <p style="color: #888; font-style: italic;">Keep tracking, keep saving!</p>
        </div>
    </div>
    `;
};
