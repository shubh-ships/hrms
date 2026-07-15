import nodemailer from "nodemailer";

export const sendReportEmail = async ({ to, subject, report, type }) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  let htmlContent = "";

  if (type === "monthly-admin") {
    htmlContent = `
      <h2>📊 Monthly Pulse Efficiency Report</h2>
      <p>Here are the reports for all users:</p>
      <table border="1" cellspacing="0" cellpadding="5">
        <thead>
          <tr>
            <th>User ID</th>
            <th>User Email</th>
            <th>Efficiency</th>
            <th>Green Tasks</th>
            <th>Yellow Tasks</th>
            <th>Red Tasks</th>
            <th>Total Tasks</th>
          </tr>
        </thead>
        <tbody>
          ${report
            .map(
              (r) => `
            <tr>
              <td>${r.userId}</td>
              <td>${r.email}</td>
              <td>${r.report.efficiency || 0}</td>
              <td>${r.report.greenCount || 0}</td>
              <td>${r.report.yellowCount || 0}</td>
              <td>${r.report.redCount || 0}</td>
              <td>${r.report.totalTasks || 0}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: htmlContent,
  });
};
