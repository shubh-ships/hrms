import express from 'express';
import * as userController from '../controllers/user.Controller.js';
import { protect } from '../middlewares/auth.js';
import { upload } from '../middlewares/multer.js';
import { userHasDepartmentRoles,userIsOrganizationAdmin } from '../middlewares/roles.js';
import { hasPermissionAndAssignableUsers } from '../middlewares/hasDynamicPermission.js';
// import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register',protect,userIsOrganizationAdmin, userController.registerUser);
router.post('/login', userController.loginUser);

router.get('/profile', protect,userController.getProfile);
router.get('/',protect,hasPermissionAndAssignableUsers(["CREATE_USER","CREATE_DEPARTMENT","WORKING_DAYS"]), userController.getAllUsers);
// router.get('/:id', userController.getUserById);
router.put('/profile/edit/:id',protect, 
upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverPicture', maxCount: 1 }
]),userController.updateProfile);
router.put('/edit/:id',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]),  userController.updateUser);
router.delete('/delete/:id',protect,hasPermissionAndAssignableUsers(["CREATE_USER"]), userController.deleteProfile);
router.patch('/change-password', protect,userController.changePassword);
router.patch('/verify', userController.verifyOtp);
router.post('/forget-password', userController.forgetPassword);
router.post('/reset-password', userController.resetPassword);
router.get('/search', userController.searchUsers);
router.post("/logout",protect,userController.logout);
router.get('/hierarchy', protect,userController.getUserHierarchy);
router.post("/add-face", upload.single("faceImage"), userController.addFaceScanController);

// this api for listing users for admin to register face of users
router.get("/fetchUsers",protect,userIsOrganizationAdmin,userController.fetchUsers);

router.post("/loginAdmin",userController.loginAdmin);

//TODO:- forget password

export default router;
