import * as organizationRepository from "../repositories/organization.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import { uploadOnCloudinary } from "../middlewares/cloudinary.js";
import { deleteOnCloudinary } from "../middlewares/cloudinary.js";
import ApiError from "../utils/apiError.js";
import nodemailer from "nodemailer";

async function sendUserAccountCreatedEmail({ to, orgName,userName, email, password }) {
  const subject = `Your Organization Has Been Created, ${orgName}!`;

  const textContent = `
Hi ${userName},

An Organization has been created.

Here are your login credentials as a organization admin:

Email: ${email}
Password: ${password}

🔐 Please change your password after your first login for security.

If you face any issues while logging in, feel free to contact us.

Warm regards,  
Team PulseSeal
`;

  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          
          <h2 style="color: #0d6efd;">Hi ${userName},</h2>

          <p>Your Organization Has Been Created, ${orgName}!</p>

          <p>Here are your login credentials as a organization Admin:</p>

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
    console.log("organization creation email sent successfully to:", to);
  } catch (error) {
    console.error("Error sending organization account creation email:", error);
  }
}

export const createOrganization = async (req) => {
  const orgData = req.body;
  // const userId = req.user.id;
  // const org_photo = req.file.organizationPicture || {};
  const org_photo = req.file
  // console.log(orgData);

  if (!orgData.org_alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const existingOrg = await organizationRepository.getOrganizationByAlias(
    orgData.org_alias
  );
  if (existingOrg) {
    throw new ApiError(400, "Organization already exists with this name");
  }

  const password = "12345678";
  const is_organizer = true;
  const { phone_number: phoneNumber, username: name, email } = orgData;

  if (!email || !name || !phoneNumber) {
    throw new ApiError(400, "Missing required user data");
  }

  const existingUser = await userRepository.getUserByEmail(email.toLowerCase().trim());
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  if (org_photo) {
    const orgPhotoCloudinary = await uploadOnCloudinary(org_photo.path);
    orgData.org_photo = {
      public_id: orgPhotoCloudinary.public_id,
      url: orgPhotoCloudinary.secure_url,
    };
  }

  const organization = await organizationRepository.createOrganization(orgData);
  if (!organization) {
    throw new ApiError(500, "Organization creation failed");
  }
  
  const newUser = await userRepository.createUser({
    name,
    email:email.toLowerCase().trim(),
    phoneNumber,
    password,
    organizationId:organization._id,
    is_organizer,
  });

  if(!newUser){
    throw new ApiError(500, "User creation failed");
  }

  const userProfile = await userRepository.createUserProfile({
    userId: newUser._id,
    firstName: newUser.name,
  });
    
  if (!userProfile) {
    throw new ApiError(500, "User profile creation failed");
  }

  await sendUserAccountCreatedEmail({to:newUser.email,orgName:organization.name,userName:newUser.name,email:newUser.email,password});

  return organization;
};

export const getOrganization = async (alias) => {
  if (!alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const organization = await organizationRepository.getOrganizationByAlias(
    alias
  );
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  return organization;
};

export const updateOrganization = async (req) => {
  const { alias } = req.params;
  const updateData = req.body;
  const org_photo = req.file || {};
  if (!alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const organization = await organizationRepository.getOrganizationByAlias(
    alias
  );
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }
  if (org_photo && org_photo.path) {
    await deleteOnCloudinary(organization.org_photo?.public_id);
    const orgPhotoCloudinary = await uploadOnCloudinary(org_photo.path);
    updateData.org_photo = {
      public_id: orgPhotoCloudinary.public_id,
      url: orgPhotoCloudinary.secure_url,
    };
  }

  Object.assign(organization, updateData);
  await organization.save();

  return organization;
};

export const deleteOrganization = async (alias) => {
  if (!alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const organization = await organizationRepository.getOrganizationByAlias(
    alias
  );
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  await organizationRepository.deleteOrganizationByAlias(alias);
  return { message: "Organization deleted successfully" };
};

export const listOrganizations = async (filters = {}, options = {}) => {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const organizations = await organizationRepository.listOrganizations(
    filters,
    skip,
    limit
  );
  const totalCount = await organizationRepository.countOrganizations(filters);

  return {
    data: organizations,
    totalCount,
    page,
    limit,
  };
};

export const editOrganizationMembers = async (
  alias,
  usersToAdd = [],
  usersToRemove = [],
  req
) => {
  if (!alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const organization = await organizationRepository.getOrganizationByAlias(
    alias
  );

  const organizationMember = await organizationRepository.getOrganizationMember(
    organization._id,
    req.user.id
  );

  const isAdmin =
    req.user.is_superuser ||
    (organizationMember && organizationMember.access_type === "ADMIN");

  if (!isAdmin) {
    throw new ApiError(403, "User is not admin!");
  }
  const ACCESS_TYPE_CHOICES = ["ADMIN", "MODERATOR", "GUEST"];

  if (usersToAdd) {
    for (const user of usersToAdd) {
      if (!user.user_id || !user.access_type) {
        throw new ApiError(
          400,
          "User id and access type are required when adding a user"
        );
      }
      if (!ACCESS_TYPE_CHOICES.includes(user.access_type)) {
        throw new ApiError(400, "Invalid access type");
      }

      const organizationMember =
        await organizationRepository.getOrganizationMember(
          organization._id,
          user.user_id
        );

      if (organizationMember) {
        await organizationRepository.editOrganizationMembers(
          organizationMember._id,
          user.access_type
        );
      } else {
        await organizationRepository.addOrganizationMember({
          user_id: user.user_id,
          access_type: user.access_type,
          org_id: organization._id,
        });
      }
    }
  }

  if (usersToRemove.length > 0) {
    await organizationRepository.removeOrganizationMembers(
      organization._id,
      usersToRemove
    );
  }

  const updatedMembers = await organizationRepository.getOrganizationMembers(
    organization._id
  );

  return updatedMembers;
};

export const getOrganizationMembers = async (alias) => {
  if (!alias) {
    throw new ApiError(400, "Organization alias is required");
  }

  const organization = await organizationRepository.getOrganizationByAlias(
    alias
  );
  if (!organization) {
    throw new ApiError(404, "Organization not found");
  }

  const members = await organizationRepository.getOrganizationMembers(
    organization._id
  );
  if (!members || members.length === 0) {
    throw new ApiError(404, "No members found for this organization");
  }

  return members;
};

export const getOrganizationManagers = async (organization) => {
  if (!organization._id) {
    throw new ApiError(400, "Organization id is required");
  }

  const members = await organizationRepository.getOrgManagers(organization._id);

  return members;
};
