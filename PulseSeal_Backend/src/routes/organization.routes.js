import express from 'express';
import * as organizationController from '../controllers/organization.controller.js';
import * as departmentController from '../controllers/department.controller.js';
import { protect } from '../middlewares/auth.js';
import {upload} from '../middlewares/multer.js';
import { userIsOrganizationAdmin, userIsSuperuser } from '../middlewares/roles.js';

const router = express.Router();

router.post('/create', protect,upload.single("organizationPicture"),userIsSuperuser,organizationController.createOrganization);
router.get('/', protect,userIsSuperuser,organizationController.listOrganizations);
router.put('/edit/:alias',protect,userIsSuperuser,upload.single("organizationPicture"),organizationController.updateOrganization);
// router.delete('/delete/:alias',protect,userIsSuperuser,organizationController.deleteOrganization);
router.get('/organization/:alias',protect,userIsOrganizationAdmin, organizationController.getOrganization);
router.get('/departments',protect,userIsOrganizationAdmin,departmentController.listDepartmentsByOrgId);
// router.patch('/:alias/members',protect,userIsOrganizationAdmin, organizationController.editOrganizationMembers);
// router.get('/:alias/members',userIsOrganizationAdmin, organizationController.getOrganizationMembers);
router.get('/org-managers',protect,userIsOrganizationAdmin,organizationController.getOrganizationManagers);

export default router;