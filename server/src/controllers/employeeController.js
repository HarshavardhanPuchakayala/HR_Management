import Employee from "../models/Employee.js";

const wouldCreateCycle = async (employeeId, managerId) => {
  if (employeeId.toString() === managerId.toString()) {
    return true;
  }

  const visited = new Set();
  let currentId = managerId;

  while (currentId) {
    const currentIdString = currentId.toString();

    // Protect against an already-corrupted hierarchy.
    if (visited.has(currentIdString)) {
      return true;
    }

    visited.add(currentIdString);

    // Proposed manager eventually reports to the employee being updated.
    if (currentIdString === employeeId.toString()) {
      return true;
    }

    const manager = await Employee.findById(currentId).select("managerId");

    if (!manager) {
      return false;
    }

    currentId = manager.managerId;
  }

  return false;
};

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      jobTitle,
      department,
      managerId,
    } = req.body;

    if (!name || !email || !jobTitle || !department) {
      return res.status(400).json({
        message: "name, email, jobTitle and department are required",
      });
    }

    if (managerId) {
      const manager = await Employee.findById(managerId);

      if (!manager || manager.status !== "active") {
        return res.status(400).json({
          message: "Invalid manager",
        });
      }
    }

    const existingEmployee = await Employee.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmployee) {
      return res.status(409).json({
        message: "Employee with this email already exists",
      });
    }

    const employee = await Employee.create({
      name,
      email: email.toLowerCase(),
      phone,
      jobTitle,
      department,
      managerId: managerId || null,
      status: "active",
    });

    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Failed to create employee",
      error: error.message,
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { managerId } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (managerId !== undefined && managerId !== null) {
      const manager = await Employee.findById(managerId);

      if (!manager || manager.status !== "active") {
        return res.status(400).json({
          message: "Invalid manager",
        });
      }

      if (await wouldCreateCycle(employeeId, managerId)) {
        return res.status(400).json({
          message: "Invalid manager assignment: would create a reporting cycle",
        });
      }
    }

    if (req.body.email) {
      const existingEmployee = await Employee.findOne({
        email: req.body.email.toLowerCase(),
        _id: { $ne: employeeId },
      });

      if (existingEmployee) {
        return res.status(409).json({
          message: "Employee with this email already exists",
        });
      }

      req.body.email = req.body.email.toLowerCase();
    }

    Object.assign(employee, req.body);

    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update employee",
      error: error.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    employee.status = "inactive";
    await employee.save();

    res.json({
      message: "Employee deactivated successfully",
      employee,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to deactivate employee",
      error: error.message,
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const filter = {};

    if (req.query.department) {
      filter.department = req.query.department;
    }

    const employees = await Employee.find(filter)
      .populate("managerId", "name email jobTitle")
      .sort({ name: 1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch employees",
      error: error.message,
    });
  }
};

export const getEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId)
      .populate("managerId", "name email jobTitle department");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch employee",
      error: error.message,
    });
  }
};

export const getDirectReports = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const reports = await Employee.find({
      managerId: employeeId,
    }).sort({ name: 1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch direct reports",
      error: error.message,
    });
  }
};