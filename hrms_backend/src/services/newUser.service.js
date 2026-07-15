
import { createUser, findUserByEmail,createAdmin,findUsersWithOrgId } from "../repositories/newUser.repository.js";
import {getOrganizationById} from "../repositories/organization.repository.js"
import * as userRepository from "../repositories/user.repository.js";
import ApiError from "../utils/apiError.js";
import nodemailer from "nodemailer";

async function sendUserAccountCreatedEmail({ to, name, email, password }) {
  const subject = `Your Account Has Been Created, ${name}!`;

  const textContent = `
Hi ${name},

An account has been created.

Here are your login credentials:

Email: ${email}
Password: ${password}

🔐 Please change your password after your first login for security.

If you face any issues while logging in, feel free to contact us.

Warm regards,  
Team Pulse Seal
`;

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          
          <h2 style="color: #0d6efd;">Hi ${name},</h2>

          <p>An account has been created for you by our team.</p>

          <p>Here are your login credentials:</p>

          <ul>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${password}</li>
          </ul>

          <p>🔐 Please change your password after your first login for security.</p>

          <p>If you face any issues while logging in, feel free to contact us.</p>

          <p>You can access your account here: 
          <a href="https://www.pulseseal.in/" 
             style="color: #0d6efd; text-decoration: none; font-weight: bold;">
            Login to Pulse Seal
          </a>
        </p>

          <p>Warm regards,<br/><strong>Team Pulse Seal</strong></p>

        </div>
      </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"PulseSeal" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
    });
    console.log("User account creation email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending user account creation email:", error);
  }
}
export const addUser = async (userData) => {
  const email = userData.email.toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) throw new ApiError(400, "User already exists");
  const maxOrganizaitionMemeber= await getOrganizationById(userData.organizationId);
  const currentMemberCount=await findUsersWithOrgId(userData.organizationId)
  if (!maxOrganizaitionMemeber) {
    throw new ApiError(404, "Organization not found");
  }
  if(currentMemberCount>maxOrganizaitionMemeber.member_count){
    throw new ApiError(400, "Organization member limit exceeded. Please upgrade your plan.");
  };
  const newUser = await createUser({ ...userData, email });
  const userProfile = await userRepository.createUserProfile({
      userId: newUser._id,
      firstName: newUser.name,
    });
  
    if (!userProfile) {
      throw new ApiError(500, "User profile creation failed");
    }

  await sendUserAccountCreatedEmail({to:email,name:userData.name,email,password:userData.password});

  return newUser;
};
export const addAdmin = async (userData) => {
  const email = userData.email.toLowerCase().trim();
  const existing = await findUserByEmail(email);
  if (existing) throw new ApiError(400, "User already exists");
  const newUser = await createAdmin({ ...userData, email });
  const userProfile = await userRepository.createUserProfile({
      userId: newUser._id,
      firstName: newUser.name,
    });
  
    if (!userProfile) {
      throw new ApiError(500, "User profile creation failed");
    }

  await sendUserAccountCreatedEmail({to:email,name:userData.name,email,password:userData.password});
  
  return newUser;
};
export const getAdmin = async (organizationId) => {
  const users = await userRepository.getAdmin(organizationId)
  return users;
};
