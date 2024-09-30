const jwt = require('jsonwebtoken');
const DeviceSession = require('../models/Device');
module.exports = async function(req, res, next) {
  console.log('Auth middleware triggered');
  console.log('Headers:', req.headers);
  
  const token = req.header('x-auth-token');
  if (!token) {
    console.log('No token found in x-auth-token header');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    console.log('Attempting to verify token');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified successfully. Decoded:', decoded);

    // Check if the device session is still active
    const session = await DeviceSession.findOne({ 
      user: decoded.userId, 
      deviceId: decoded.deviceId,
      token: token,
      isActive: true 
    });

    if (!session) {
      return res.status(401).json({ message: 'Session is not valid or has expired' });
    }

    // Update last active time
    session.lastActive = Date.now();
    await session.save();

    req.user = decoded.userId;
    req.deviceId = decoded.deviceId;
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};