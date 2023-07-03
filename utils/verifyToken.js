const jwt = require('jsonwebtoken')

// TODO: Catch all the errors 

if (!process.env.JWT_SECRET) {
    throw new Error('Please add your JWT_SECRET to .env.local') 
}

const verifyToken = (jsonWebToken) => {

    const JWT_SECRET = process.env.JWT_SECRET

    const jwtData = jwt.verify(jsonWebToken, JWT_SECRET, (err, payload) => {
        if (err) { 
            return 
        } else {
            return payload
        }
    })

    /*
    const jwtPayload = {
        username: user.username, 
        isAdmin: user.isAdmin
    }

    */
    return jwtData
}

module.exports = verifyToken;