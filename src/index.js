// index.js

const fs = require('fs');
const tls = require('tls');
const axios = require('axios');
const { format } = require('date-fns');
const chalk = require('chalk');
const { sendSlackNotification } = require('./slackHelper');

const checkInterva1 = 24 * 60 * 60 * 1000; // 24 hours
const checkInterval = 1000 * 5; // 5 mins
const expiryThreshold = 90; // 90 days


const hostnames = [
    'www.oneindia.in',
    // Add more hostnames as needed
];

async function checkCertificateExpiry(hostname) {
    return new Promise((resolve, reject) => {
        const options = {
            host: hostname,
            port: 443,
            rejectUnauthorized: false, // Ignore SSL/TLS validation for self-signed certificates
        };

        const socket = tls.connect(options, () => {
            const certificate = socket.getPeerCertificate();
            socket.end();

            const commonName = certificate.subject.CN;
            const issuer = certificate.issuer.CN;
            const validTo = new Date(certificate.valid_to);
            const daysRemaining = Math.floor((validTo - Date.now()) / (24 * 60 * 60 * 1000));

            console.log(chalk.blueBright(`Certificate details for ${hostname}:`));
            console.log(chalk.blueBright(`Common Name: ${commonName}`));
            console.log(chalk.blueBright(`Issuer: ${issuer}`));
            console.log(chalk.blueBright(`Expiry Date: ${format(validTo, 'yyyy-MM-dd HH:mm:ss')}`));
            console.log(chalk.blueBright(`Days Remaining for the Certifcate to expire: ${daysRemaining}`));

            resolve(daysRemaining);
        });

        socket.on('error', (error) => {
            console.error(chalk.red(`Error checking certificate for ${hostname}: ${error.message}`));
            reject(error);
        });
    });
}


async function sendSlackNotification2(message) {
    try {
        const response = await axios.post(slackWebhookUrl, { text: message });
        console.log(chalk.greenBright('Slack notification sent successfully!'));
        console.log(chalk.greenBright('Slack Response:', response.data));
    } catch (error) {
        console.error(chalk.red('Error sending Slack notification:', error.message));
        console.error(chalk.greenBright('Error Response:', error.response.data));
    }
}

function monitorCertificates() {
    console.log(chalk.yellow('Starting SSL certificate monitoring...'));

    setInterval(async () => {
        for (const hostname of hostnames) {
            try {
                const daysRemaining = await checkCertificateExpiry(hostname);
                console.log(chalk.yellow(`SSL certificate for ${hostname} will expire in ${daysRemaining} days.`));
                if (daysRemaining !== null && daysRemaining < expiryThreshold) {
                    const message = `SSL certificate for ${hostname} will expire in ${daysRemaining} days. Renew it soon!`;
                    console.log(chalk.yellow('Starting Slack Notification...'));
                    await sendSlackNotification('#your-channel', message);
                    console.log(chalk.yellow('Slack Notification Sent...'));
                } else {
                    console.log(chalk.yellowBright(`Certificate for ${hostname} is valid for at least ${expiryThreshold} days.`));
                }
            } catch (error) {
                // Handle errors from checkCertificateExpiry
                console.log(chalk.red(`Error while processing hostnames for SSL certificate retrieval`));
            }
        }
    }, checkInterval);
}

// Start monitoring
monitorCertificates();
