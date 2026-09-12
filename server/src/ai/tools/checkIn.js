const checkInTool = {
  name: "checkIn",

  description:
    "Check in the currently authenticated employee for today. Use this when the employee explicitly wants to start or check in for work. Do not ask for or supply an employeeId or date.",

  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
};

export default checkInTool;