const https = require('https');
const slack = require('slack');
const tls = require('tls'); //
const chalk = require('chalk'); //


const moment = require('moment');

// Configuration
const hostnames = require('./hostnames.js'); // Import hostnames from the separate file
const slackWebhookUrl = 'https://hooks.slack.com/services/...'; // Replace with your Slack webhook URL
const notificationThresholdDays = 30; // Days before expiry to send notification
async function checkCertificateValidity(hostname) {
    try {
        console.log(chalk.blue(`Connecting to ${hostname}...`));

        const options = {
            hostname,
            rejectUnauthorized: true,
        };

        console.log(chalk.yellow(`Retrieving SSL certificate...`));
        const secureContext = tls.createSecureContext(options);
        const socket = tls.connect(443, 'www.example.com', { secureContext });


        const response = await new Promise((resolve, reject) => {
            const req = https.get(options, (res) => {
                resolve(res);
            });
            req.on('error', reject);
        });

        console.log(chalk.green(`Certificate retrieved!`));

        const cert = response.socket.getPeerCertificate();
        // console.log(chalk.yellow(`Certificate details:`));
        // console.log(chalk.blue(JSON.stringify(cert, null, 2))); // Log certificate details with indentation

        console.log(chalk.yellow(`Verifying certificate validity...`));

        if (tls.checkServerIdentity(hostname, cert)) {
            console.log(chalk.green(`SSL certificate for ${hostname} is valid!`));
            console.log('cert.validTo', cert.validTo);
            console.log(chalk.blue(`Expiry date: ${moment(cert.validTo * 1000).format('YYYY-MM-DD')}`));
        } else {
            console.error(chalk.red(`SSL certificate for ${hostname} is invalid or not trusted!`));
        }
    } catch (error) {
        console.error(chalk.red(`Error checking certificate for ${hostname}:`), error);
    }
}


// Function to send Slack notification
function sendSlackNotification(hostname, expiryDate) {
    const slackClient = new slack.WebClient(slackWebhookUrl);
    slackClient.chat.postMessage({
        channel: '#your-channel-name', // Replace with your channel name
        text: `*SSL Certificate Expiry Alert for ${hostname}!* :warning:\nExpiry Date: ${expiryDate.format('YYYY-MM-DD')}`,
    });
}

// Monitor hostnames periodically
setInterval(() => {
    hostnames.forEach(checkCertificateValidity);
}, 5 * 1000); // Check every 24 hours

