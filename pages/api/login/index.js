import { connectToDatabase } from "../../../lib/mongodb"
const generateToken = require('../../../utils/generateToken')
const allowCors = require('../../../utils/allowCors')
const bcrypt = require('bcryptjs/dist/bcrypt');


async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("users");

    const user = req.body

    if (!user.username || !user.password) {
        return res.status(400).json({
            success: false, err: "You must provide a username and password"})
    }

    const username = user.username
    const matchingUser = await collection.findOne({ username })

    if (matchingUser && (await bcrypt.compare(user.password, matchingUser.password))) {
        const jwtPayload = {
            username: matchingUser.username,
            isAdmin: matchingUser.isAdmin
        }

        return res.status(200).json({
            success: true,
            username: matchingUser.username,
            isAdmin: matchingUser.isAdmin,
            token: generateToken(jwtPayload)
        })
    } else {
        return res.status(400).json({
            success: false,
            message: "Invaid username or password!"
        })
    }
        
  }

  module.exports = allowCors(handler)