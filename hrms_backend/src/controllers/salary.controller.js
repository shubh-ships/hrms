import salaryService from "../services/salary.service.js";

export const createTemplate = async (req, res, next) => {
  try {
    const data = await salaryService.createTemplate({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getTemplates = async (req, res, next) => {
  try {
    const data = await salaryService.getTemplates(req.user.organizationId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const createComponent = async (req, res, next) => {
  try {
    const data = await salaryService.addComponent({
      ...req.body,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      success: true,
      message: "Component created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
// export const addComponent = async (req, res, next) => {
//   try {
//     const data = await salaryService.addComponent(req.body);
//     res.json({ success: true, data });
//   } catch (e) { next(e); }
// };

export const getComponents = async (req, res, next) => {
  try {
    const data = await salaryService.getComponents(
      req.params.templateId,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const replaceComponents = async (req, res, next) => {
  try {
    const data = await salaryService.replaceComponents(
      req.params.templateId,
      req.body.components,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const assignSalary = async (req, res, next) => {
  try {
    const data = await salaryService.assignSalary({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const editSalary = async (req, res, next) => {
  try {
    const data = await salaryService.editSalary(
      req.body.employeeId,
      req.body.basic,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const reviseSalary = async (req, res, next) => {
  try {
    const data = await salaryService.reviseSalary({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const runPayroll = async (req, res, next) => {
  try {
    const data = await salaryService.runPayroll({
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getPayrollOverview = async (req, res, next) => {
  try {
    const data = await salaryService.getPayrollOverview({
      ...req.query,
      organizationId: req.user.organizationId,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getEmployeePayrollHistory = async (req, res, next) => {
  try {
    const data = await salaryService.getEmployeePayrollHistory(
      req.params.employeeId,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};


export const addSalaryAction = async (req, res, next) => {
  try {
    const data = await salaryService.addSalaryAction({
      ...req.body,
      organizationId: req.user.organizationId,
      createdBy: req.user._id,
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const getSalaryActions = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query;
    const data = await salaryService.getSalaryActions(
      employeeId,
      month,
      year,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

export const deleteSalaryAction = async (req, res, next) => {
  try {
    const data = await salaryService.deleteSalaryAction(
      req.params.id,
      req.user.organizationId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};
