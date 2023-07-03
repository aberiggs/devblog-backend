const jwt = require('jsonwebtoken')

if (!process.env.JWT_SECRET) {
    throw new Error('Please add your JWT_SECRET to .env.local') 
}

const generateToken = (payload) => {

    const JWT_SECRET = process.env.JWT_SECRET;

    return jwt.sign(payload, JWT_SECRET, {})
}

module.exports = generateToken;