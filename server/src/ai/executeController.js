const createResponseCapture = () => {
  let statusCode = 200;
  let body;
  let responded = false;

  const res = {
    status(code) {
      if (responded) {
        throw new Error(
          "Response status cannot be changed after the response was sent"
        );
      }

      if (
        !Number.isInteger(code) ||
        code < 100 ||
        code > 599
      ) {
        throw new Error(
          "Invalid HTTP status code"
        );
      }

      statusCode = code;
      return res;
    },

    json(value) {
      if (responded) {
        throw new Error(
          "Response cannot be sent more than once"
        );
      }

      body = value;
      responded = true;

      return res;
    },

    getStatusCode() {
      return statusCode;
    },

    getBody() {
      return body;
    },

    hasResponded() {
      return responded;
    },
  };

  return res;
};

export const executeController = async (
  controller,
  {
    user,
    body = {},
    query = {},
    params = {},
  } = {}
) => {
  if (typeof controller !== "function") {
    throw new Error(
      "executeController requires a controller function"
    );
  }

  const req = {
    user,
    body,
    query,
    params,
  };

  const res = createResponseCapture();

  try {
    await controller(req, res);
  } catch (error) {
    return {
      success: false,
      error:
        error.message ||
        "Controller execution failed",
    };
  }

  if (!res.hasResponded()) {
    return {
      success: false,
      error:
        "Controller completed without sending a response",
    };
  }

  const statusCode =
    res.getStatusCode();
  const responseBody =
    res.getBody();

  if (statusCode < 400) {
    return {
      success: true,
      result: responseBody,
    };
  }

  return {
    success: false,
    error:
      responseBody?.message ||
      `Controller returned HTTP ${statusCode}`,
    result: responseBody,
  };
};