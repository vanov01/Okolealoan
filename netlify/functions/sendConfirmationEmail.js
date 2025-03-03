const nodemailer = require("nodemailer");

exports.handler = async (event, context) => {
  // Allow only POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }
  
  try {
    // Parse the incoming request body
    const data = JSON.parse(event.body);
    const { email, firstName } = data;
    if (!email || !firstName) {
      return {
        statusCode: 400,
        body: "Missing email or firstName",
      };
    }
    
    // Create a transporter using Gmail SMTP
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "mwananchihuslerloans@gmail.com",
        pass: "wnxy zfts mwau lvtj",
      },
    });
    
    // Set up email options
    let mailOptions = {
      from: "mwananchihuslerloans@gmail.com",
      to: email,
      subject: "Loan Application Confirmation",
      text: `Hello ${firstName}, your loan application has been received. We will process it shortly.`,
      html: `<p>Hello <strong>${firstName}</strong>,</p>
             <p>Your loan application has been received. We will process it shortly.</p>`,
    };
    
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email sent successfully" }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
