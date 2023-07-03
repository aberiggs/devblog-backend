import { connectToDatabase } from "../../../lib/mongodb"   

export default async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("users");
    
    const username = String(req.query.username);
    const usr = await collection.findOne({ username: username }).catch(err => console.error(`Error fetching user: ${err}`))

    if (!usr) {
        return res.status(404).json({ success: false, error: "User not found!" })
    }
    return res.status(200).json({ success: true, message: "User exists!"})
}