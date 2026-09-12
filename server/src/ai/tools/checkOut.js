const checkOutTool = {
  name: "checkOut",

  description:
    "Check out the currently authenticated employee for today. Use this when the employee explicitly wants to finish or check out from work. Do not ask for or supply an employeeId or date.",

  parameters: {
    type: "object",
    properties: {},
    required: [],
    additionalProperties: false,
  },
};

export default checkOutTool;