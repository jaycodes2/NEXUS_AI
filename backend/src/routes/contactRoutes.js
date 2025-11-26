import express from "express";
import nodemailer from "nodemailer";
const router = express.Router();
router.post("/send", async (req, res) => {
    try {
        const { name, email, company, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.CONTACT_EMAIL,
                pass: process.env.CONTACT_EMAIL_PASSWORD
            }
        });
        await transporter.sendMail({
            from: `"Contact Form" <${process.env.CONTACT_EMAIL}>`,
            to: process.env.CONTACT_RECEIVER, // where YOU want to receive emails
            subject: "New Contact Form Message",
            text: `
New Contact Submission:

Name: ${name}
Email: ${email}
Company: ${company}
Message:
${message}
      `
        });
        return res.json({ success: true });
    }
    catch (err) {
        console.error("Email Error:", err);
        return res.status(500).json({ error: "Failed to send email" });
    }
});
export default router;
