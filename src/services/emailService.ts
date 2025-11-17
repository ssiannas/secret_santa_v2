import { Participant } from "../types/participant";

const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
    private transporter: any;
    private testaccount: any;

    constructor() {
        this.init();
    }

    async init() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    private async sendEmail(to: string, subject: string, text: string, html?: string) {
        const mailOptions = {
            from: `Secret Santa Burner <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        };
        try {
            await this.transporter.sendMail(mailOptions);
            console.log(`Email sent to ${to}`);
        } catch (error) {
            console.error(`Error sending email to ${to}:`, error);
        }
    }

    async sendResultsEmail(assignments: Record<string, Participant>) {
        // send one meail to each participant with their assignment
        for (const giverEmail in assignments) {
            const receiver = assignments[giverEmail];
            const subject = 'Your Secret Santa Assignment!';
            const text = `Hello!
You have been chosen as the Secret Santa for: ${receiver.name}!
Happy gifting! 🎁
            `;
            const html = `<p>Hello! You have been chosen as the Secret Santa for: <strong>${receiver.name}</strong>!<br/>Happy gifting! 🎁</p>`;
            await this.sendEmail(giverEmail, subject, text, html);
        }
    }
}

export default new EmailService();