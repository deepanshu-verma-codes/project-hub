/**
 * Input Validation Middleware Factory
 * Uses Zod (or Joi) to validate request bodies against defined schemas.
 * Prevents invalid data from reaching the controllers/services.
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Assuming Zod schema interface
    schema.parse(req.body);
    next();
  } catch (error) {
    // Format Zod errors
    if (error.errors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(err => ({ field: err.path.join('.'), message: err.message }))
      });
    }
    return res.status(400).json({ message: 'Invalid input data' });
  }
};

module.exports = { validate };
