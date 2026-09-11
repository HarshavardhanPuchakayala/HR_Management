import { checkIn } from "../../controllers/attendanceController.js";
import { executeController } from "../executeController.js";

const executeCheckIn = async ({ user }) => {
  return executeController(checkIn, {
    user,
  });
};

export default executeCheckIn;