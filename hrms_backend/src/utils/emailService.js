import nodemailer from "nodemailer";

// Create transporter (configure with your email service)
const transporter = nodemailer.createTransport({
  service: 'Gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  shortlisted: `
    <h2>Application Shortlisted</h2>
    <p>Dear {{candidateName}},</p>
    <p>Congratulations! Your application for <strong>{{jobTitle}}</strong> has been shortlisted.</p>
    <p>We will contact you soon with the next steps.</p>
    <p>Best regards,<br>{{companyName}} Team</p>
  `,
  
  interview: `
    <h2>Interview Invitation</h2>
    <p>Dear {{candidateName}},</p>
    <p>You have been selected for an interview for <strong>{{jobTitle}}</strong>.</p>
    {{#if interviewDate}}
    <p><strong>Interview Date:</strong> {{interviewDate}}</p>
    {{/if}}
    <p>Best regards,<br>{{companyName}} Team</p>
  `,
  
  hired: `
    <h2>Job Offer - Congratulations!</h2>
    <p>Dear {{candidateName}},</p>
    <p>We are pleased to offer you the position of <strong>{{jobTitle}}</strong>!</p>
    <p>Welcome to the team!</p>
    <p>Best regards,<br>{{companyName}} Team</p>
  `,
  
  rejected: `
    <h2>Update on Your Application</h2>
    <p>Dear {{candidateName}},</p>
    <p>Thank you for your interest in <strong>{{jobTitle}}</strong>.</p>
    <p>After careful consideration, we've decided to move forward with other candidates.</p>
    <p>We wish you the best in your job search.</p>
    <p>Best regards,<br>{{companyName}} Team</p>
  `,

  jobClosedNotification: `
    <h2>Update on Your Job Application</h2>
    <p>Dear {{candidateName}},</p>
    <p>We're writing to inform you that the position <strong>{{jobTitle}}</strong> at {{companyName}} has been closed.</p>
    <p>While this specific opportunity is no longer available, we appreciate your interest in our company and encourage you to apply for other positions that match your skills and experience.</p>
    <p>Thank you for your understanding.</p>
    <p>Best regards,<br>{{companyName}} Recruitment Team</p>
  `,

  applicationConfirmation: `
    <h2>Application Received</h2>
    <p>Dear {{candidateName}},</p>
    <p>Thank you for applying for the <strong>{{jobTitle}}</strong> position at {{companyName}}.</p>
    <p>We have received your application and will review it carefully. If your qualifications match our requirements, we will contact you for the next steps.</p>
    <p><strong>Application Date:</strong> {{applicationDate}}</p>
    <p>Best regards,<br>{{companyName}} Recruitment Team</p>
  `
};

export const sendEmail = async (emailData) => {
  try {
    let htmlContent = emailTemplates[emailData.template];
    
    // Replace template variables
    for (const [key, value] of Object.entries(emailData.context)) {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(placeholder, value || '');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailData.to,
      subject: emailData.subject,
      html: htmlContent
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};