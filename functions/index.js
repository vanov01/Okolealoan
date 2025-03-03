const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const nodemailer = require("nodemailer");

// Create a transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mwananchihuslerloans@gmail.com",
    pass: "wnxy zfts mwau lvtj",
  },
});

// Cloud Function to send email confirmation when a new application is added
// to Firestore
exports.sendConfirmationEmail = functions.firestore
    .document("applications/{docId}")
    .onCreate((snap, context) => {
      const data = snap.data();
      const email = data.email; // Applicant's email address
      const firstName = data.firstName; // Applicant's first name

      const mailOptions = {
        from: "mwananchihuslerloans@gmail.com",
        to: email,
        subject: "Loan Application Confirmation",
        // eslint-disable-next-line max-len
        text: `Hello ${firstName}, your loan application has been received. We will process it shortly.`,
        // eslint-disable-next-line max-len
        html: `<p>Hello <strong>${firstName}</strong>,</p><p>Your loan application has been received. We will process it shortly.</p>`,
      };

      return transporter.sendMail(mailOptions)
          .then(() => {
            console.log("Confirmation email sent to:", email);
          })
          .catch((error) => {
            console.error("Error sending email:", error);
          });
    });
