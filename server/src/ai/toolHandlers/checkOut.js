import { checkOut } from "../../controllers/attendanceController.js";
import { executeController } from "../executeController.js";

const executeCheckOut = async ({ user }) => {
  return executeController(checkOut, {
    user,
  });
};

export default executeCheckOut;