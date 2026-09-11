const createLeaveRequestTool = {
  name: "createLeaveRequest",

  description:
    "Create a leave request for the currently authenticated employee. Use this only when the employee explicitly wants to request leave. Do not use this for questions about existing leave requests. Never invent missing information.",

  parameters: {
    type: "object",

    properties: {
      startDate: {
        type: "string",
        description:
          "Leave start date in YYYY-MM-DD format.",
      },

      endDate: {
        type: "string",
        description:
          "Leave end date in YYYY-MM-DD format.",
      },

      leaveType: {
        type: "string",
        enum: [
          "sick",
          "casual",
          "vacation",
          "other",
        ],
        description:
          "Type of leave being requested.",
      },

      reason: {
        type: "string",
        description:
          "Reason for requesting the leave.",
      },
    },

    required: [
      "startDate",
      "endDate",
      "leaveType",
      "reason",
    ],

    additionalProperties: false,
  },
};

export default createLeaveRequestTool;