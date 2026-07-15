import * as roleService from '../services/roleDefination.service.js';

export const  createRole= async (req, res) => {
  try {
    const roleData = req.body;

    const role = await roleService.createRole(roleData);

    return res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
