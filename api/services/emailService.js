"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer = require('nodemailer');
require('dotenv').config();
class EmailService {
    constructor() {
        this.init();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
        });
    }
    sendEmail(to, subject, text, html) {
        return __awaiter(this, void 0, void 0, function* () {
            const mailOptions = {
                from: `Secret Santa Burner <${process.env.EMAIL_USER}>`,
                to,
                subject,
                text,
                html,
            };
            try {
                yield this.transporter.sendMail(mailOptions);
                console.log(`Email sent to ${to}`);
            }
            catch (error) {
                console.error(`Error sending email to ${to}:`, error);
            }
        });
    }
    sendResultsEmail(assignments) {
        return __awaiter(this, void 0, void 0, function* () {
            // send one meail to each participant with their assignment
            for (const giverEmail in assignments) {
                const receiver = assignments[giverEmail];
                const subject = 'Your Secret Santa Assignment!';
                const text = `Hello!
You have been chosen as the Secret Santa for: ${receiver.name}!
Happy gifting! 🎁
            `;
                const html = `<p>Hello! You have been chosen as the Secret Santa for: <strong>${receiver.name}</strong>!<br/>Happy gifting! 🎁</p>`;
                yield this.sendEmail(giverEmail, subject, text, html);
            }
        });
    }
}
exports.default = new EmailService();
