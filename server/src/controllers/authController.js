const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const mongoose = require('mongoose');

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

    const existingByBusinessName = await Business.findOne({ name: businessName });
    if (existingByBusinessName) {
      return res.status(400).json({ message: 'Business name already registered' });
    }

    if (businessEmail) {
      const existingByBusinessEmail = await Business.findOne({ email: businessEmail });
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
  const session = await mongoose.startSession();
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

    const existingBusinessByName = await Business.findOne({ name: businessName });
    if (existingBusinessByName) {
      return res.status(400).json({ message: 'Business name already registered' });
    }

    const existingBusinessByEmail = await Business.findOne({ email: businessEmail });
    if (existingBusinessByEmail) {
      return res.status(400).json({ message: 'Business email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let createdUser;
    let createdBusiness;

    await session.withTransaction(async () => {
      createdBusiness = await Business.create(
        [
          {
            name: businessName,
            email: businessEmail,
            phone: businessPhone,
            gstNumber,
            businessType,
            industry,
            registrationDate,
            panNumber,
            address: {
              addressLine1,
              addressLine2,
              city,
              state,
              pincode,
              country,
            },
          },
        ],
        { session }
      );

      const businessDoc = createdBusiness[0];

      createdUser = await User.create(
        [
          {
            fullName,
            email,
            password: hashedPassword,
            businessId: businessDoc._id,
            // Backward compatible fields (optional)
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
          },
        ],
        { session }
      );
    });

    const user = Array.isArray(createdUser) ? createdUser[0] : createdUser;

    const token = jwt.sign({ userId: user._id, businessId: user.businessId }, process.env.JWT_SECRET, {
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
        businessId: user.businessId,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  } finally {
    session.endSession();
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

    const token = jwt.sign({ userId: user._id, businessId: user.businessId }, process.env.JWT_SECRET, {
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
        businessId: user.businessId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

module.exports = { checkUserExists, registerUser, loginUser };