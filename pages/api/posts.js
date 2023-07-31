import { connectToDatabase } from "../../lib/mongodb"
const allowCors = require('../../utils/allowCors')

async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("posts");
    
    console.log("Fetching all posts...")

    const results = await collection.find({}).project({
      "_id": 0,
      "__v": 0,
    }).toArray().catch(err => console.error(`Error fetching all posts: ${err}`))

    return res.status(200).json({ success: true, posts: results })
    
}

module.exports = allowCors(handler)