import { connectToDatabase } from "../../../lib/mongodb"
const { BlobServiceClient } = require("@azure/storage-blob");
const verifyToken = require('../../../utils/verifyToken')

if (!process.env.AZURE_CONNECTION_STRING) {
    throw new Error('Please add your Azure Storage connection string to .env.local')
}

export default async function handler(req, res) {
    console.log("Delete post...")
    const { database } = await connectToDatabase();
    const collection = database.collection("posts");

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
    const containerName = `blog-posts`
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    let body = req.body
    if (!body || !body.postName || !body.token) {
        return res.status(400).json({
            success: false,
            error: 'You must be logged in and provide a postname.'
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
            error: 'Sorry, you must have admin privileges to edit posts!'
        })
    }

    const postToDelete = await collection.findOne({postName: body.postName })

    if (!postToDelete) {
        return res.status(400).json({
            success: false,
            error: ("Post doesn't exist")
        })
    }

    const blobName = postToDelete.postName
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    const uploadBlobResponse = blockBlobClient.deleteIfExists

    console.log(`Deleted blob ${blobName} successfully`, uploadBlobResponse.requestId)

    collection.deleteOne(postToDelete)
    .then(() => {
        return res.status(201).json({
            success: true,
            message: 'Post Deleted',
        })
    }).catch(error => {
        return res.status(400).json({
            error,
            message: 'An unexpected error has occured!'
        })
    })
    
}

