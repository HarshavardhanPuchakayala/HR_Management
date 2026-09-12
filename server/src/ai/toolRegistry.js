import createLeaveRequestTool from "./tools/createLeaveRequest.js";
import getMyLeaveRequestsTool from "./tools/getMyLeaveRequests.js";
import checkInTool from "./tools/checkIn.js";
import checkOutTool from "./tools/checkOut.js";

import executeCreateLeaveRequest from "./toolHandlers/createLeaveRequest.js";
import executeGetMyLeaveRequests from "./toolHandlers/getMyLeaveRequests.js";
import executeCheckIn from "./toolHandlers/checkIn.js";
import executeCheckOut from "./toolHandlers/checkOut.js";

const toolEntries = [
  {
    declaration: createLeaveRequestTool,
    execute: executeCreateLeaveRequest,
    isAction: true,
  },
  {
    declaration: getMyLeaveRequestsTool,
    execute: executeGetMyLeaveRequests,
    isAction: false,
  },
  {
    declaration: checkInTool,
    execute: executeCheckIn,
    isAction: true,
  },
  {
    declaration: checkOutTool,
    execute: executeCheckOut,
    isAction: true,
  },
];

export const toolDeclarations =
  toolEntries.map(
    ({ declaration }) => declaration
  );

export const toolRegistry =
  Object.fromEntries(
    toolEntries.map(
      ({ declaration, execute }) => [
        declaration.name,
        execute,
      ]
    )
  );

export const toolActionMap =
  Object.fromEntries(
    toolEntries.map(
      ({ declaration, isAction }) => [
        declaration.name,
        isAction,
      ]
    )
  );

export default toolRegistry;