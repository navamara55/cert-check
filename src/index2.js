import https from 'https';
import tls from 'tls';
import forge from 'node-forge';
import moment from 'moment';
import chalk from 'chalk';
const hostnames = require('./hostnames.js'); // Import hostnames from the separate file
export async function checkCertificateValidity(hostname) {
    try {
        console.log(chalk.blue(`Connecting to ${hostname}...`));

        const options = {
            hostname,
            rejectUnauthorized: true,
        };

        const socket = tls.connect(443, hostname, options);

        socket.on('secureConnect', async () => {
            const tlsSocket = socket._tlsSocket; // Access the underlying TLS socket
            const cert = tlsSocket.peerCertificate;

            console.log(chalk.yellow(`Certificate retrieved!`));

            console.log(chalk.yellow(`Verifying certificate validity using node-forge...`));

            // Convert Forge certificate to PEM format for validation
            const pem = forge.pki.certificateToPem(cert);
            const parsedCert = forge.pki.certificateFromPem(pem);

            if (parsedCert.verifyHostname(hostname)) {
                console.log(chalk.green(`SSL certificate for ${hostname} is valid!`));
                console.log(chalk.blue(`Expiry date: ${moment(parsedCert.validity.notAfter * 1000).format('YYYY-MM-DD')}`));
            } else {
                console.error(chalk.red(`SSL certificate for ${hostname} is invalid or not trusted!`));
            }
        });
    } catch (error) {
        console.error(chalk.red(`Error checking certificate for ${hostname}:`), error);
    }
}


// Monitor hostnames periodically
setInterval(() => {
    hostnames.forEach(checkCertificateValidity);
}, 5 * 1000); // Check every 24 hours

