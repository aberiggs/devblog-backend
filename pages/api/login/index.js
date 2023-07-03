import { connectToDatabase } from "../../../lib/mongodb"
const generateToken = require('../../../utils/generateToken')

const bcrypt = require('bcryptjs/dist/bcrypt');

export default async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("users");

    console.log(req.body)

    const user = req.body

    if (!user.username || !user.password) {
        return res.status(400).json({
            success: false, err: "You must provide a username and password"})
    }

    const username = user.username
    const matchingUser = await collection.findOne({ username })

    if ( matchingUser && (await bcrypt.compare(user.password, matchingUser.password))) {
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