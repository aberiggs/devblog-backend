import { connectToDatabase } from "../../../lib/mongodb"   
const generateToken = require('../../../utils/generateToken')
const bcrypt = require('bcryptjs/dist/bcrypt');

const hashedPass = async (password) => {
    const salt = await bcrypt.genSalt(10)
    const hashedPass = await bcrypt.hash(password, salt)
    return hashedPass
}

export default async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("users");

    const newUser = req.body
    const username = newUser.username
    const password = await hashedPass(newUser.password)
    const isAdmin = false
    const user = { username, password, isAdmin }

    const userExists = await collection.findOne({ username }).catch(err => console.error(`Error fetching user: ${err}`))

    if (userExists) {
        return res.status(400).json({
            success: false,
            message: "A user with that username already exists!"
        })
    }

    collection.insertOne(user).catch(err => {
        return res.status(400).json({
            err,
            message: 'User not created!'
        })
    })

    const jwtPayload = {
        username: user.username,
        isAdmin: user.isAdmin
    }

    return res.status(201).json({
        success: true,
        username: user.username,
        isAdmin: user.isAdmin,
        token: generateToken(jwtPayload)
    })

}