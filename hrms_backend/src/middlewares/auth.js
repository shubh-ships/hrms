import jwt from 'jsonwebtoken';
import ApiError from '../utils/apiError.js';

export const protect = (req, res, next) => {
  const tokenInHeader =  req.headers.authorization?.split(' ')[1];
  const tokenInCookie = req.cookies?.accessToken;
  if(!tokenInHeader && !tokenInCookie) {
        return res.status(401).json({error:"Unauthorized, no token provided!"})
  }
  let decoded;
  try{
    if (tokenInCookie) {
      decoded = jwt.verify(tokenInCookie, process.env.JWT_SECRET);
    } else if (tokenInHeader) {
      decoded = jwt.verify(tokenInHeader, process.env.JWT_SECRET);
    }
    req.user = decoded.user;
    req.userRole = decoded.userRole;
    next();
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Access denied');
    }
    next();
  };
};
