import { Participant } from "../types/participant";
import { Resend } from "resend";

require('dotenv').config();

class EmailService {
    private resend: any;

    constructor() {
        this.init();
    }

    async init() {
        this.resend = new Resend(process.env.RESEND_API_KEY!);
    }

    private async sendEmail(to: string, subject: string, html?: string) {
        const mailOptions = {
            from: `Mr. Secret Santa <secretsanta@siannas.xyz>`,
            to: [to],
            subject: subject,
            html: html || '',
        };
        try {
            const data = await this.resend.emails.send(mailOptions);
        } catch (error) {
            console.error(`Error sending email to ${to}:`, error);
        }
    }

    async sendResultsEmail(assignments: Record<string, Participant>) {
        // send one meail to each participant with their assignment
        for (const giverEmail in assignments) {
            const receiver = assignments[giverEmail];
            const subject = 'Your Secret Santa Assignment!';
            const html = `<p>Hello! You have been chosen as the Secret Santa for: <strong>${receiver.name}</strong>!<br/>Happy gifting! 🎁</p>`;
            await this.sendEmail(giverEmail, subject, html);
        }
    }
}

export default new EmailService();