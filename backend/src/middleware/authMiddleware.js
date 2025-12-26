const jwt = require('jsonwebtoken');

// Middleware to verify JWT and extract User/Tenant info
const authenticateToken = (req, res, next) => {
    // 1. Get Token from Header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: "Access Token Required" });
    }

    // 2. Verify Token
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Invalid Token" });
        }

        // 3. Attach User Info to Request Object
        req.user = user;
        // req.user contains: { userId, tenantId, role }

        next();
    });
};

module.exports = { authenticateToken };