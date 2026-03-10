import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const app = express();
const port = 3001;

app.use(cors());
// Increase payload size limit for base64 PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: 'ricardoortega341@gmail.com',
        pass: 'tczp kfas kwir qkjl'
    }
});

app.post('/api/send-email', (req, res) => {
    const { to, subject, message, pdfBase64, filename } = req.body;

    if (!to || !subject || !message || !pdfBase64) {
        return res.status(400).json({ error: 'Faltan parámetros requeridos (to, subject, message, pdfBase64)' });
    }

    // El pdfBase64 normalmente viene como "data:application/pdf;base64,JVBERi0..."
    // Necesitamos quitar el prefijo para adjuntarlo correctamente.
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, "");

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

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error enviando correo:', error);
            return res.status(500).json({ error: 'Error enviando correo', details: error.message });
        }
        console.log('Correo enviado: %s', info.messageId);
        res.status(200).json({ success: true, messageId: info.messageId });
    });
});

app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
