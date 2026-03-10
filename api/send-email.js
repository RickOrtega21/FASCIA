import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { to, subject, message, pdfBase64, filename } = req.body;

    if (!to || !subject || !message || !pdfBase64) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (to, subject, message, pdfBase64)' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, 
        auth: {
            user: 'ricardoortega341@gmail.com',
            pass: 'tczp kfas kwir qkjl'
        }
    });

    // Strip base64 prefix if present
    let base64Data = pdfBase64;
    if (pdfBase64.includes('base64,')) {
        base64Data = pdfBase64.split('base64,')[1];
    }

    const mailOptions = {
        from: '"FASCIA App" <ricardoortega341@gmail.com>',
        to: to,
        subject: subject,
        text: message,
        attachments: [
            {
                filename: filename || 'reporte.pdf',
                content: base64Data,
                encoding: 'base64'
            }
        ]
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado con éxito: %s', info.messageId);
        return res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('SERVER_MAIL_ERROR:', error);
        return res.status(500).json({ 
            error: 'Error enviando correo', 
            details: error.message,
            code: error.code
        });
    }
}
