export const notFound = (req, res) => {
  return res.status(404).json({
    message: "Route not found",
  });
};

export const errorHandler = (
  error,
  req,
  res,
  next
) => {
  console.error(
    "Unhandled error:",
    error.message
  );

  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request body too large",
    });
  }

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    error.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      message: "Invalid JSON payload",
    });
  }

  if (
    error.message ===
    "CORS origin not allowed"
  ) {
    return res.status(403).json({
      message: "Origin not allowed",
    });
  }

  if (
    error.name === "ValidationError"
  ) {
    return res.status(400).json({
      message: "Validation failed",
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid request value",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      message: "Duplicate record",
    });
  }

  return res.status(500).json({
    message: "Internal server error",
  });
};