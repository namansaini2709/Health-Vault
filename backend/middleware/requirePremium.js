const requirePremium = (req, res, next) => {
    // For demonstration purposes, we'll simulate a user object on the request.
    // In a real application, this would be populated by an authentication middleware (e.g., JWT, session).
    const user = req.user || { tier: 'free' }; // Default to 'free' if no user is attached

    if (user.tier === 'premium') {
        next(); // User is premium, allow access
    } else {
        res.status(403).json({ 
            error: 'This feature is available for premium users only.',
            upgrade_prompt: 'Please upgrade your account to access nearby doctor discovery.'
        });
    }
};

module.exports = requirePremium;
