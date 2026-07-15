import nodemailer from 'nodemailer';

const  sendTaskStatusEmailController = async (req, res) => {
  try {
    const { to, name, taskName, taskStatus } = req.body;

    if (!to || !taskName || !taskStatus) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: `Task Progress Update: ${taskName}`,
      html: `
        <p>Hello ${name || ''},</p>
        <p>Your task <b>${taskName}</b> is currently <b>${taskStatus}% done</b>.</p>
        <p>Keep going!</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: `Email sent to ${to}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send email.' });
  }
};


export default sendTaskStatusEmailController
