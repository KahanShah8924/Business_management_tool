const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if a user or business already exists in MongoDB
const checkUserExists = async (req, res) => {
  const { email, businessName, businessEmail } = req.body;

  try {
    if (!email || !businessName) {
      return res.status(400).json({ message: 'Email and business name are required' });
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const existingByBusinessName = await User.findOne({ businessName });
    if (existingByBusinessName) {
      return res.status(400).json({ message: 'Business name already registered' });
    }

    if (businessEmail) {
      const existingByBusinessEmail = await User.findOne({ businessEmail });
      if (existingByBusinessEmail) {
        return res.status(400).json({ message: 'Business email already registered' });
      }
    }

    res.status(200).json({ message: 'User details available' });
  } catch (error) {
    console.error('Error checking user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Register a new user in MongoDB and return a JWT
const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      businessName,
      gstNumber,
      businessType,
      industry,
      registrationDate,
      addressLine1,
      addressLine2,
      city,
      pincode,
      state,
      country,
      businessEmail,
      businessPhone,
      panNumber,
      agreedToTerms,
    } = req.body;

    if (
      !fullName ||
      !email ||
      !password ||
      !businessName ||
      !gstNumber ||
      !businessType ||
      !industry ||
      !registrationDate ||
      !addressLine1 ||
      !city ||
      !pincode ||
      !state ||
      !country ||
      !businessEmail ||
      !businessPhone ||
      !panNumber
    ) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      businessName,
      gstNumber,
      businessType,
      industry,
      registrationDate,
      addressLine1,
      addressLine2,
      city,
      pincode,
      state,
      country,
      businessEmail,
      businessPhone,
      panNumber,
      agreedToTerms,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

// Login user and return JWT
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        businessName: user.businessName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

module.exports = { checkUserExists, registerUser, loginUser };