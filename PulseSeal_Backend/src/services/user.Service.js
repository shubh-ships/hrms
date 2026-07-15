import { uploadOnCloudinary } from "../middlewares/cloudinary.js";
import { deleteOnCloudinary } from "../middlewares/cloudinary.js";
import { getDepartmentById } from "../repositories/department.repository.js";
import * as userRepository from "../repositories/user.repository.js";
import ApiError from "../utils/apiError.js";
import { generateToken } from "../utils/generateToken.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { editDepartmentMembers } from "./department.service.js";
import * as attendanceServices from "../services/attendance.service.js";
import * as taskAssignmentServices from "../services/taskAssignment.service.js";
import * as organizationRepository from "../repositories/organization.repository.js";
// import * as userRoleRepo from '../repositories/roleDefination.repository.js';
import * as approvalRepository from "../repositories/approval.repository.js";
import * as userRoleRepo from "../repositories/userRole.repository.js";
import { calculateOvertimeForDay } from "./overtime.service.js";
import dotenv from "dotenv";
import { addFaceToUser } from "../utils/awsRecogination.js";
import fs from "fs";

dotenv.config();

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
Team Hackingly Innovators
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
      from: `"Hackingly Innovators" <${process.env.EMAIL_USER}>`,
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

export const registerUser = async (userData, organizationId) => {
  const { email, phoneNumber, departmentId, role } = userData;

  let name = userData.name?.trim();

  if (
    !name ||
    !email ||
    !phoneNumber ||
    !departmentId ||
    !role ||
    !organizationId
  ) {
    throw new ApiError(400, "All fields is required");
  }

  const existingUser = await userRepository.getUserByEmail(email);
  if (existingUser) {
    throw new ApiError(400, "User already exists with this email");
  }

  const password = `${name.replace(/\s+/g, "")}@Hackingly2025`;

  const newUser = await userRepository.createUser({
    name,
    email,
    phoneNumber,
    departmentId,
    password,
    organizationId,
  });

  if (!newUser) {
    throw new ApiError(500, "User registration failed");
  }

  const userProfile = await userRepository.createUserProfile({
    userId: newUser._id,
    firstName: newUser.name,
  });

  if (!userProfile) {
    throw new ApiError(500, "User profile creation failed");
  }

  const department = await getDepartmentById(departmentId);

  await editDepartmentMembers(department.alias, {
    add: [{ user_id: newUser.id, role: role }],
  });

  await sendUserAccountCreatedEmail({ to: email, name, email, password });

  return {
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
      department: department.name,
      role: role,
    },
    token: generateToken({ id: newUser._id }, process.env.JWT_EXPIRATION),
  };
};

export const loginUser = async ({ email, password }, res) => {
  if (!email || !password) {
    throw new ApiError(400, "email and password is required");
  }

  let user = await userRepository.getUserByEmail(email);
  console.log(user)
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive || user.isFreezed) {
    throw new ApiError(401, "user is not Active or freezed");
  }

  const organization = await organizationRepository.getOrganizationById(
    user.organizationId
  );

  if (organization && organization.is_active === false) {
    throw new ApiError(
      401,
      "Your organization is deactivated, please contact to admin"
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }
  let userRole;
  if (!user.is_superuser && !user.is_organizer) {
    const role = await userRepository.getUserRoleByUserId(user.id);
    userRole = role?.roleDefinitionId;
  }
  const org_permission = {
    isHRMS_enabled: organization?.isHRMS_enabled,
    isTaskManagement_enabled: organization?.isTaskManagement_enabled,
  };
  
  const token = generateToken(
    { user, userRole, org_permission },
    process.env.JWT_EXPIRATION
  );
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 60 * 60 * 1000,
  });

  const now = new Date();
  const monthName = now.toLocaleString("default", { month: "long" });

  let attendance;
  if (!user.is_organizer && !user.is_superuser) {
    attendance = await attendanceServices.createAttendance({
      userId: user.id,
      month: monthName,
    });
  }

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      loginTime: attendance?.attendance?.loginTime,
    },
    token: token,
  };
};

export const getProfile = async (userId) => {
  const userProfile = await userRepository.getUserProfileById(userId);
  if (!userProfile) {
    throw new ApiError(404, "User Profile not found");
  }

  return {
    userProfile: userProfile,
  };
};

export const updateProfile = async (req) => {
  const id = req.user.id;
  const updateData = req.body;
  const { profilePicture, coverPicture } = req.files || {};

  const userProfile = await userRepository.getUserProfileById(id);

  const user = await userRepository.getUserById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (profilePicture) {
    await deleteOnCloudinary(userProfile.profilePicture?.public_id);
    const profilePictureCloudinary = await uploadOnCloudinary(
      profilePicture[0].path
    );
    updateData.profilePicture = {
      public_id: profilePictureCloudinary.public_id,
      url: profilePictureCloudinary.secure_url,
    };
  }

  if (coverPicture) {
    await deleteOnCloudinary(userProfile.coverPicture?.public_id);
    const coverPictureCloudinary = await uploadOnCloudinary(
      coverPicture[0].path
    );
    updateData.coverPicture = {
      public_id: coverPictureCloudinary.public_id,
      url: coverPictureCloudinary.secure_url,
    };
  }

  const updateUserProfile = await userRepository.updateUserProfileById(
    id,
    updateData
  );
  const updateUser = await userRepository.updateUserById(id, {
    name: updateData.name || user.name,
    email: updateData.email || user.email,
  });
  return {
    userProfile: { updateUser, updateUserProfile },
  };
};

export const updateUser = async (id, data) => {
  const { updateUserData, updateRollData } = data;
  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  let updatedUser = "";
  if (updateUserData) {
    if (updateUserData.departments){
      updateUserData.departmentId = updateUserData.departments;
      delete updateUserData.departments;
    }
    updatedUser = await userRepository.updateUserById(id, updateUserData);
    if (!updatedUser) {
      throw new ApiError(500, "User update failed");
    }
  }
  if (updateRollData) {
    const userRoleId = await userRoleRepo.findByUserId(id);
    if (!userRoleId) {
      const data = {
        ...updateRollData,
        user_id: id,
        organizationId: user.organizationId,
      };
      await userRoleRepo.createUserRole(data);
    }
    await userRoleRepo.editUserRoleByUserID(id, updateRollData);
  }

  return {
    user: updatedUser,
  };
};

export const deleteUser = async (id) => {
  const user = await userRepository.getUserById(id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const userProfile = await userRepository.getUserProfileById(id);
  if (!userProfile) {
    throw new ApiError(404, "User Profile not found");
  }
  await userRepository.deleteUserById(id);
  await userRepository.deleteUserProfileById(id);
  return {
    data: {},
  };
};

export const changePassword = async (
  userId,
  { currentPassword, newPassword }
) => {
  const user = await userRepository.getUserById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  console.log(currentPassword, "pswd");
  console.log(newPassword, "pswd");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Old password is incorrect");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;

  const updatedUser = await userRepository.updateUserById(userId, {
    password: hashedNewPassword,
  });

  return {
    user: {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    },
  };
};

export const forgetPassword = async ({ email }) => {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;

  await userRepository.updateUserById(user._id, { otp: otp });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Hackingly Registration Email Verify OTP",
    html: `<h1>Please Verify Your Email with this <strong>${otp}</strong></h1>`,
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.log("Error:", err);
    } else {
      console.log("Email sent:", info.response);
    }
  });

  return;
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedNewPassword;
  user.otp = null;

  await userRepository.updateUserById(user._id, {
    password: hashedNewPassword,
    otp: null,
  });
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export const verifyOtp = async (verificationData) => {
  const { email, otp } = verificationData;
  const user = await userRepository.getUserByEmail(email);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  user.otp = null;
  await userRepository.updateUserById(user._id, { otp: null });
  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  };
};

export const getAllUsers = async (org_id) => {
  const users = await userRepository.getUsers(org_id);
  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found");
  }

  return {
    users,
  };
};

export const searchUsers = async (query) => {
  const regex = new RegExp(query, "i"); // Case-insensitive search
  const users = await userRepository.getUsers();

  const filteredUsers = users.filter(
    (user) => user.name.match(regex) || user.email.match(regex)
  );

  if (!filteredUsers || filteredUsers.length === 0) {
    throw new ApiError(404, "No users found matching the search criteria");
  }

  return {
    users: filteredUsers,
  };
};

export const logout = async (req, res) => {
  const userId = req.user.id;

  if (!userId) {
    throw new ApiError(400, "You are already logged out");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const approvals = await approvalRepository.todayApprovalsByUserId(
    userId,
    startOfDay,
    endOfDay
  );

  const taskCount = await taskAssignmentServices.taskLength(userId);

  const validStatuses = new Set(["Approved", "Rejected", "Fraud","Reversed"]);

  const allTasksReviewed =
    approvals.length === taskCount &&
    approvals.every((item) => validStatuses.has(item.status));

  if (taskCount > 0 && !allTasksReviewed) {
    throw new ApiError(
      400,
      "Manager approval is pending for one or more tasks"
    );
  }

  await attendanceServices.handleLogout(userId);

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });

  return true;
};


async function getSubtreeUserRoleIds(userRoleId) {
  const result = [];

  async function recurse(ids) {
    result.push(...ids);
    const children = await userRoleRepo.findChildren(ids);
    if (children.length) {
      const childIds = children.map((c) => c._id);
      await recurse(childIds);
    }
  }

  await recurse([userRoleId]);
  return result;
}

export async function getHierarchyUsersByUserId(userId) {
  const userRole = await userRoleRepo.findByUserId(userId);
  if (!userRole) return [];

  const subtreeIds = await getSubtreeUserRoleIds(userRole._id);

  const filteredIds = subtreeIds.filter(
    (id) => id.toString() !== userRole._id.toString()
  );

  const userRoles = await userRoleRepo.findByIds(filteredIds, [
    {
      path: "user_id",
      populate: { path: "departmentId", model: "Department" },
    },
    { path: "roleDefinitionId" },
  ]);
  return userRoles.map((ur) => ({
    userId: ur.user_id._id,
    name: ur.user_id.name,
    email: ur.user_id.email,
    departments: Array.isArray(ur.departments)
      ? ur.departments.map((dep) => ({
          id: dep?._id || null,
          name: dep?.name || null,
        }))
      : [],
    role: ur.roleDefinitionId.roleName,
    hierarchyLevel: ur.roleDefinitionId.hierarchyLevel,
    parentRoleId: ur.parentRoleId,
  }));
}

export const addUserFaceScan = async (userId, localFilePath) => {
  const fileBuffer = fs.readFileSync(localFilePath);
  const uploaded = await uploadOnCloudinary(localFilePath);
  if (!uploaded || !uploaded.secure_url)
    throw new Error("Cloudinary upload failed");

  const faceIds = await addFaceToUser(fileBuffer, userId);

  if (!faceIds || faceIds.length === 0) {
    throw new Error("No face detected in the image");
  } else if (faceIds.length > 1) {
    throw new Error(
      "Multiple faces detected. Please upload an image with only one face."
    );
  }

  const updatedUser = await userRepository.addFaceDataToUser(
    userId,
    uploaded.secure_url,
    faceIds
  );

  return { user: updatedUser, faceIds, faceImageUrl: uploaded.secure_url };
};

export const fetchUsers = async () => {
  const users = await userRepository.fetchUsers();
  return users;
};

export const loginAdmin = async ({ email, password }, res) => {
  if (!email || !password) {
    throw new ApiError(400, "email and password is required");
  }

  let user = await userRepository.getUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isActive || user.isFreezed) {
    throw new ApiError(401, "user is not Active or freezed");
  }

  const organization = await organizationRepository.getOrganizationById(
    user.organizationId
  );

  if (organization && organization.is_active === false) {
    throw new ApiError(
      401,
      "Your organization is deactivated, please contact to admin"
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.is_superuser && !user.is_organizer) {
    throw new ApiError(403, "Access denied. Not an admin user.");
  }

  const token = generateToken({ user }, process.env.JWT_EXPIRATION);
  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 60 * 60 * 1000,
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token: token,
  };
};
