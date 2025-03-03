const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:5001'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const uri = "mongodb+srv://cluster01:Cheps.1815@cluster01.ie9od.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01";
const client = new MongoClient(uri);
let db;

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db("Cluster01");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
})();

async function getAccessToken() {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        headers: {
            'Authorization': `Basic ${auth}`
        }
    });

    const data = await response.json();
    return data.access_token;
}

function getTimestamp() {
    return new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

app.post('/submit_application', async (req, res) => {
    const applicationsCollection = db.collection('applications');
    try {
        await applicationsCollection.insertOne(req.body);
        res.json({ success: true, message: 'Loan application submitted successfully!', trackingId: req.body.trackingId, qualifiedAmount: req.body.qualifiedAmount });
    } catch (error) {
        console.error("Error saving application:", error);
        res.status(500).json({ success: false, message: "Error saving application." });
    }
});

app.post('/initiate_mpesa_payment', async (req, res) => {
    try {
        const accessToken = await getAccessToken();
        const facilitationFee = 245;
        const callbackUrl = `${process.env.NGROK_URL}/mpesa_callback`;

        let phoneNumber = req.body.phone.replace(/^\+254|^0/, "254");
        const timestamp = getTimestamp();
        const password = Buffer.from(process.env.MPESA_SHORT_CODE + process.env.MPESA_PASSKEY + timestamp).toString("base64");

        const requestBody = {
            BusinessShortCode: process.env.MPESA_SHORT_CODE,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: facilitationFee,
            PartyA: phoneNumber,
            PartyB: process.env.MPESA_SHORT_CODE,
            PhoneNumber: phoneNumber,
            CallBackURL: callbackUrl,
            AccountReference: "OkoaLoan",
            TransactionDesc: "Loan Payment"
        };

        console.log("STK Push Request Body:", requestBody);

        const stkPushResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(requestBody)
        });

        const stkPushData = await stkPushResponse.json();
        console.log("STK Push Response:", stkPushData);

        if (stkPushData.ResponseCode === '0') {
            res.json({ success: true, message: 'M-Pesa STK push initiated successfully.', CheckoutRequestID: stkPushData.CheckoutRequestID });
        } else {
            res.status(400).json({ success: false, message: stkPushData.errorMessage });
        }
    } catch (error) {
        console.error("M-Pesa Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/mpesa_callback', async (req, res) => {
    console.log('M-Pesa Callback:', req.body);
    const applicationsCollection = db.collection('applications');
    try {
        await applicationsCollection.updateOne(
            { trackingId: req.body.Body.stkCallback.MerchantRequestID },
            { $set: { 
                status: req.body.Body.stkCallback.ResultCode === '0' ? 'paid' : 'failed', 
                mpesaTransactionId: req.body.Body.stkCallback.TransactionID, 
                mpesaResultDesc: req.body.Body.stkCallback.ResultDesc, 
                mpesaPhoneNumber: req.body.Body.stkCallback.PhoneNumber 
            }}
        );
        console.log("Application updated:", req.body);
    } catch (error) {
        console.error("Error updating application:", error);
    }

    res.sendStatus(200);
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
