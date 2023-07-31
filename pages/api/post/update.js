import { date } from "azure";
import { connectToDatabase } from "../../../lib/mongodb"   
const { BlobServiceClient } = require("@azure/storage-blob");
const verifyToken = require('../../../utils/verifyToken')
const allowCors = require('../../../utils/allowCors')

async function handler(req, res) {
    // MongoDB
    const { database } = await connectToDatabase();
    const collection = database.collection("posts");
    // Azure Blob Storage  
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
    const containerName = `blog-posts`

    let body = req.body
    if (!body || !body.postName || !body.markdown || !body.postSummary || !body.token) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a post with a post name, post summary, and markdown content.'
        })
    }
    
    console.log("Verifying token...")
    const jwtData = verifyToken(body.token)

    if(!jwtData) {
        return res.status(400).json({
            success: false,
            error: 'You are not a valid user!'
        })
    }

    if (!jwtData.isAdmin) {
        return res.status(400).json({
            success: false,
            error: 'Sorry, you must have admin privileges to edit posts!'
        })
    }

    console.log("Finding post to update...")
    const postToUpdate = await collection.findOne({postName: body.postName })
    console.log("Attempting to update post...")

    if (!postToUpdate) {
        return res.status(400).json({
            success: false,
            error: ("Post doesn't exist: " + err)
        })
    }

    postToUpdate.postName = body.postName
    postToUpdate.postSummary = body.postSummary  
    
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const content = body.markdown
    const blobName = postToUpdate.postName
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length)
    .catch(error => {
        return res.status(400).json({
            error,
            message: 'Post not updated!'
        })
    })

    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId)
    
    const updatedPost = {
        $set: {
            postName : body.postName,
            postSummary : body.postSummary,
            postDate : body.date
        }
    }

    const result = await collection.updateOne({ _id: postToUpdate._id }, updatedPost)            
    
    if (!result)
        return res.status(400).json({
            success: false,
            message: 'Post not updated!'
        })
    

    return res.status(201).json({
        success: true,
        id: postToUpdate._id,
        message: 'Post updated',
    })
}

module.exports = allowCors(handler)