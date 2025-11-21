import { Participant } from "../types/participant";
import { Resend } from "resend";

require('dotenv').config();

class EmailService {
    private resend: any;
    private readonly RATE_LIMIT_DELAY = 500; // ms between requests
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // ms before retry

    constructor() {
        this.init();
    }

    async init() {
        this.resend = new Resend(process.env.RESEND_API_KEY!);
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async sendEmailWithRetry(
        to: string,
        subject: string,
        html: string,
        attempt: number = 1
    ): Promise<boolean> {
        const mailOptions = {
            from: `Mr. Secret Santa <${process.env.EMAIL_FROM}>`,
            to: [to],
            subject: subject,
            html: html,
        };

        try {
            const data = await this.resend.emails.send(mailOptions);
            console.log(`Email sent to ${to}:`, data.id);
            return true;
        } catch (error: any) {
            const statusCode = error.statusCode || error.status;
            const isRateLimitError = statusCode === 429;
            const isRetryable = isRateLimitError || statusCode >= 500;

            if (isRetryable && attempt < this.MAX_RETRIES) {
                const backoffDelay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
                console.warn(
                    `Attempt ${attempt} failed for ${to} (${statusCode}). Retrying in ${backoffDelay}ms...`
                );
                await this.delay(backoffDelay);
                return this.sendEmailWithRetry(to, subject, html, attempt + 1);
            }

            console.error(`Failed to send email to ${to} after ${attempt} attempts:`, error.message);
            return false;
        }
    }

    private async sendEmail(to: string, subject: string, html?: string): Promise<boolean> {
        return this.sendEmailWithRetry(to, subject, html || '');
    }

    async sendResultsEmail(assignments: Record<string, Participant>): Promise<void> {
        const emails = Object.entries(assignments);
        const results = {
            sent: 0,
            failed: 0,
            failed_emails: [] as string[],
        };

        console.log(`Sending ${emails.length} Secret Santa assignment emails...`);

        for (let i = 0; i < emails.length; i++) {
            const [giverEmail, receiver] = emails[i];
            const subject = 'Your Secret Santa Assignment!';
            const html = `<p>Hello! You have been chosen as the Secret Santa for: <strong>${receiver.name}</strong>!<br/>Happy gifting! 🎁</p>`;

            const success = await this.sendEmail(giverEmail, subject, html);

            if (success) {
                results.sent++;
            } else {
                results.failed++;
                results.failed_emails.push(giverEmail);
            }

            // Add delay between requests to respect rate limits
            if (i < emails.length - 1) {
                await this.delay(this.RATE_LIMIT_DELAY);
            }
        }

        console.log(`Email sending complete. Sent: ${results.sent}, Failed: ${results.failed}`);

        if (results.failed > 0) {
            console.warn(`Failed to send emails to: ${results.failed_emails.join(', ')}`);
        }
    }
}

export default new EmailService();