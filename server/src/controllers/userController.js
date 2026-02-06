const User = require('../models/User');
const Business = require('../models/Business');

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const business = user.businessId
      ? await Business.findById(user.businessId).select('-__v')
      : null;

    res.status(200).json({
      ...user.toObject(),
      business,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

module.exports = { getUserProfile };
