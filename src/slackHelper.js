// slackHelper.js

const { WebClient } = require('@slack/web-api');
const chalk = require('chalk');

const slackToken = 'YOUR_SLACK_TOKEN'; // Replace with your Slack app token

const slackClient = new WebClient(slackToken);

async function sendSlackNotification(channel, message) {
    console.log(chalk.green('Slack notification started!'));
    try {
        const response = await slackClient.chat.postMessage({
            channel,
            text: message,
        });
        console.log(chalk.green('Slack notification sent successfully!'));
        console.log(chalk.green('Slack Response:', response));
    } catch (error) {
        console.error(chalk.red('Error sending Slack notification:', error.message));
    }
}

module.exports = {
    sendSlackNotification,
};
