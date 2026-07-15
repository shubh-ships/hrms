// import express from "express";
// import {
//   createEmployee,
//   getEmployees,
//   getEmployeeById,
//   updateEmployee,
//   deleteEmployee,
//   getEmployeeLeaveBalances,
//   updateEmployeeLeaveBalances,
//   getEmployeeSalary,
//   updateEmployeeSalary
// } from "../controllers/employee.controller.js";
// import { auth } from "../middleware/auth.js";
// import { isHR } from "../middleware/roles.js";
// import { upload } from "../middlewares/multer.js";

// const router = express.Router();

// router.post("/", auth,upload.array("proofs"), isHR, createEmployee);
// router.get("/", auth, getEmployees);
// router.get("/:id", auth, getEmployeeById);
// router.patch("/:id", auth, isHR, updateEmployee);
// router.delete("/:id", auth, isHR, deleteEmployee);
// router.get("/:id/leave-balances", auth, getEmployeeLeaveBalances);
// router.patch("/:id/leave-balances", auth, isHR, updateEmployeeLeaveBalances);
// router.get("/:id/salary", auth, getEmployeeSalary);
// router.patch("/:id/salary", auth, isHR, updateEmployeeSalary);

// export default router;
import express from "express";
import multer from "multer";

const generateDocumentFields = (maxCount = 5) => {
  const fields = [];
  for (let i = 0; i < maxCount; i++) {
    fields.push({ name: `documents[${i}][proof]`, maxCount: 1 });
  }
  return fields;
};

import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeesByOrganization,
  getUpcomingNewJoiners,
  bulkCreateEmployees,
  bulkUploadBankDetails,
  bulkUpdateEmployeeStatus,
  updatebulkEmployeeBankDetails,
  getEmployeeDocuments,
  addEmployeeDocument,
  removeEmployeeDocument,
  getAllTemplates,
} from "../controllers/employee.controller.js";
import { upload, uploadExcel } from "../middlewares/multer.js";
import { protect } from "../middlewares/auth.js";

//for attendance
import {getEmployeeDetails} from "../controllers/newAttendance.controller.js"

const router = express.Router();

// Routes
router.post(
  "/",
  protect,
  upload.fields(generateDocumentFields()),
  createEmployee,
);

router.get("/", protect, getEmployees);

router.get("/upcoming-joiners", protect, getUpcomingNewJoiners);

router.get("/:id", protect, getEmployeeById);
router.get(
  "/organization/:organizationId",
  protect,
  getEmployeesByOrganization,
);

router.put("/bulk-update-bank-details", protect, updatebulkEmployeeBankDetails);
router.put(
  "/:id",
  protect,
  upload.fields(generateDocumentFields()),
  updateEmployee,
);

router.delete("/:id", protect, deleteEmployee);

router.post(
  "/bulk-upload",
  upload.single("file"),
  protect,
  bulkCreateEmployees,
);
router.post(
  "/bulk-bank-upload",
  protect,
  uploadExcel.single("file"),
  bulkUploadBankDetails,
);

router.post(
  "/bulk-update-employee-status",
  protect,
  uploadExcel.single("file"),
  bulkUpdateEmployeeStatus,
);

router.get("/:employeeId/documents",protect, getEmployeeDocuments);
router.post(
  "/:employeeId/documents",
  protect,
  upload.single("document"),
  addEmployeeDocument
);
router.delete(
  "/:employeeId/documents/:documentId",
  protect,
  removeEmployeeDocument
);

router.get("/all/templates",protect,getAllTemplates);

// for attendance
router.get('/getEmpDetails/:id', getEmployeeDetails);
export default router;
