const getMyLeaveRequestsTool = {
  name: "getMyLeaveRequests",

  description:
    "Get the leave requests belonging to the currently authenticated employee. Use this when the employee asks about their own leave requests. Include the status filter when they ask about a specific status such as approved, pending, rejected, or cancelled. Omit status to get all leave requests regardless of status. Never access another employee's leave requests.",

  parameters: {
    type: "object",

    properties: {
      status: {
        type: "string",
        enum: [
          "pending",
          "approved",
          "rejected",
          "cancelled",
        ],
        description:
          "Optional leave request status to filter by. Omit this to get all leave requests regardless of status.",
      },
    },

    required: [],

    additionalProperties: false,
  },
};

export default getMyLeaveRequestsTool;