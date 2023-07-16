import { connectToDatabase } from "../../../lib/mongodb"
const verifyToken = require('../../../utils/verifyToken')

const bcrypt = require('bcryptjs/dist/bcrypt');

export default async function handler(req, res) {
    const { database } = await connectToDatabase();

    const jwt = req.body.token
    if (!jwt) {
        return res.status(400).json({
            success: false,
            message: "No JWT!"
        })
    }

    const jwtData = verifyToken(jwt)
    
    if (!jwtData) {
        return res.status(400).json({
            success: false,
            message: "Invalid JWT!"
        })
    }

    return res.status(200).json({
        jwtData
    })
    
  }