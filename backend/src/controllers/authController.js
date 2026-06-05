const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generates a JWT token for a given user ID.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

/**
 * Auth Controller: Login
 * POST /api/auth/login
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicit Input Validation
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginUser,
};
