import { getMyLeaveRequests } from "../../controllers/leaveRequestsController.js";
import { executeController } from "../executeController.js";

const executeGetMyLeaveRequests = async ({ user, args }) => {
  return executeController(getMyLeaveRequests, {
    user,
    query: args,
  });
};

export default executeGetMyLeaveRequests;