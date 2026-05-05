const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'agri_secret_key';
const JWT_EXPIRES_IN = '7d';

function generateToken(user) {
  return jwt.sign(
    { id: user._id },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function toResponse(user) {
  return {
    id: user._id,
    name: user.name,
    district: user.district
  };
}

function validateRegisterInput(body) {
  const { name, phone, password, district } = body;
  const errors = [];

  if (!name || typeof name !== 'string') {
    errors.push('name is required');
  } else if (name.trim().length < 2) {
    errors.push('name must be at least 2 characters');
  }

  if (!phone || typeof phone !== 'string') {
    errors.push('phone is required');
  } else if (phone.trim().length < 10) {
    errors.push('phone must be at least 10 digits');
  }

  if (!password || typeof password !== 'string') {
    errors.push('password is required');
  } else if (password.length < 6) {
    errors.push('password must be at least 6 characters');
  }

  if (!district || typeof district !== 'string') {
    errors.push('district is required');
  } else if (district.trim().length < 2) {
    errors.push('district must be at least 2 characters');
  }

  return errors;
}

/**
 * POST /api/auth/register
 * Create new user, hash password with bcrypt, return JWT
 */
const registerUser = async (req, res) => {
  try {
    const body = req.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const password = body.password;
    const district = typeof body.district === 'string' ? body.district.trim() : '';

    const validationErrors = validateRegisterInput({ name, phone, password, district });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        message: validationErrors[0]
      });
    }

    const existing = await User.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({ name, phone, password: hashedPassword, district });
    await user.save();

    const token = generateToken(user);

    return res.status(201).json({
      token,
      user: toResponse(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    console.error('Register error.message:', error.message);
    console.error('Register error.stack:', error.stack);

    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }

    return res.status(500).json({
      message: 'Failed to register',
      error: error.message
    });
  }
};

/**
 * POST /api/auth/login
 * Verify phone + password with bcrypt.compare, return JWT
 */
const loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body || {};

    if (!phone || !password) {
      return res.status(400).json({
        message: 'phone and password are required'
      });
    }

    const user = await User.findOne({ phone: String(phone).trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const match = await bcrypt.compare(String(password), user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid phone or password' });
    }

    const token = generateToken(user);

    return res.status(200).json({
      token,
      user: toResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    console.error('Login error.message:', error.message);
    return res.status(500).json({
      message: 'Failed to login',
      error: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUser
};
