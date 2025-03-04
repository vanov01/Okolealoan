const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // Parse the incoming JSON body
    const data = JSON.parse(event.body);
    const {
      email,
      firstName,
      lastName,
      mobileNumber,
      nationalId,
      loanPurpose,
      employmentStatus,
      monthlyIncome,
      country,
    } = data;

    // Define your admin email (update this to your actual email)
    const adminEmail = "mwananchihuslerloans@gmail.com";

    // Create a transporter using Gmail SMTP credentials
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mwananchihuslerloans@gmail.com",
        pass: "wnxy zfts mwau lvtj",
      },
    });

    // Compose the confirmation email to the applicant
    const applicantMailOptions = {
      from: "mwananchihuslerloans@gmail.com",
      to: email,
      subject: "Loan Application Confirmation",
      text:
        `Dear ${firstName} ${lastName},\n\n` +
        `Thank you for applying for a loan with Okolea Mwananchi. Your application has been received and is under review.\n\n` +
        `Best regards,\nOkolea Mwananchi`,
      html:
        `<p>Dear <strong>${firstName} ${lastName}</strong>,</p>` +
        `<p>Thank you for applying for a loan with Okolea Mwananchi. Your application has been received and is under review.</p>` +
        `<p>Best regards,<br>Okolea Mwananchi</p>`,
    };

    // Compose the notification email to the admin
    const adminMailOptions = {
      from: "mwananchihuslerloans@gmail.com",
      to: adminEmail,
      subject: "New Loan Application Received",
      text:
        `A new loan application has been submitted:\n` +
        `Name: ${firstName} ${lastName}\n` +
        `Email: ${email}\n` +
        `Mobile: ${mobileNumber}\n` +
        `National ID: ${nationalId}\n` +
        `Loan Purpose: ${loanPurpose}\n` +
        `Employment Status: ${employmentStatus}\n` +
        `Monthly Income: ${monthlyIncome}\n` +
        `Country: ${country}\n`,
      html:
        `<h3>New Loan Application Received</h3>` +
        `<ul>` +
        `<li><strong>Name:</strong> ${firstName} ${lastName}</li>` +
        `<li><strong>Email:</strong> ${email}</li>` +
        `<li><strong>Mobile:</strong> ${mobileNumber}</li>` +
        `<li><strong>National ID:</strong> ${nationalId}</li>` +
        `<li><strong>Loan Purpose:</strong> ${loanPurpose}</li>` +
        `<li><strong>Employment Status:</strong> ${employmentStatus}</li>` +
        `<li><strong>Monthly Income:</strong> ${monthlyIncome}</li>` +
        `<li><strong>Country:</strong> ${country}</li>` +
        `</ul>`,
    };

    // Send both emails concurrently
    const [applicantResult, adminResult] = await Promise.all([
      transporter.sendMail(applicantMailOptions),
      transporter.sendMail(adminMailOptions),
    ]);

    console.log("Applicant email sent:", applicantResult.response);
    console.log("Admin email sent:", adminResult.response);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Both emails sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending emails:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
