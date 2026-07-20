
export const instructorOnly = (req, res, next) => {
  if (
    req.user.role !== "instructor" &&
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Instructor access required",
    });
  }

  next();
};