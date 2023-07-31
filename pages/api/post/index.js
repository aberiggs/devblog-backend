import { connectToDatabase } from "../../../lib/mongodb"   
const { BlobServiceClient } = require("@azure/storage-blob");
const verifyToken = require('../../../utils/verifyToken')
const allowCors = require('../../../utils/allowCors')

if (!process.env.AZURE_CONNECTION_STRING) {
    throw new Error('Please add your Azure Storage connection string to .env.local')
}

async function handler(req, res) {
    // MongoDB
    const { database } = await connectToDatabase();
    const collection = database.collection("posts");
    // Azure Blob Storage  
    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
    const containerName = `blog-posts`
        
    let body = req.body;
    if (!body || !body.postName || !body.markdown || !body.postSummary /*|| !body.token*/) {
        return res.status(400).json({
            success: false,
            error: 'You must be logged in and provide a post with a post name, post summary, and markdown content.'
        })
    }

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
            error: 'Sorry, you must have admin privileges to create posts!'
        })
    }

    const containerClient = blobServiceClient.getContainerClient(containerName);

    const content = body.markdown
    // TODO: Unique index on postName
    const blobName = body.postName
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const uploadBlobResponse = await blockBlobClient.upload(content, content.length)
    .catch(error => {
        return res.status(400).json({
            error,
            message: 'Post not created!'
        })
    })

    console.log(`Upload block blob ${blobName} successfully`, uploadBlobResponse.requestId)
    
    
    const newPost = {postName: body.postName, postSummary: body.postSummary, postDate: body.postDate}

    // TODO: Look at this again. Will this really happen?
    if (!newPost) {
        return res.status(400).json({
            success: false,
            error: ("Post doesn't exist: " + err)
        })
    }

    const result = collection.insertOne(newPost).catch(error => {
        return res.status(400).json({
            error,
            message: 'Post not created!'
        })
    })

    return res.status(201).json({
        success: true,
        id: result._id,
        message: 'Post created',
    })

}

module.exports = allowCors(handler)