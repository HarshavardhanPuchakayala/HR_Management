import { createLeaveRequest } from "../../controllers/leaveRequestsController.js";
import { executeController } from "../executeController.js";

const executeCreateLeaveRequest = async ({ user, args }) => {
  return executeController(createLeaveRequest, {
    user,
    body: args,
  });
};

export default executeCreateLeaveRequest;