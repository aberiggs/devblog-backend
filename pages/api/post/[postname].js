import { connectToDatabase } from "../../../lib/mongodb"   
const { BlobServiceClient } = require("@azure/storage-blob");
const verifyToken = require('../../../utils/verifyToken')
const allowCors = require('../../../utils/allowCors')

if (!process.env.AZURE_CONNECTION_STRING) {
    throw new Error('Please add your Azure Storage connection string to .env.local')
}

async function handler(req, res) {
    const { database } = await connectToDatabase();
    const collection = database.collection("posts");

    const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_CONNECTION_STRING);
    const containerName = `blog-posts`
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const postName = String(req.query.postname);

    console.log("Post name: " + postName)
    const post = await collection.findOne({postName: postName }).catch(err => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: err
            })
        }
    })

    if (!post) {
        return res.status(404).json({
            success: false,
            error: 'Post not found'
        })
    }

    console.log("Working...")
    const blobClient = containerClient.getBlobClient(postName)

    // Get blob content from position 0 to the end
    // In Node.js, get downloaded data by accessing downloadBlockBlobResponse.readableStreamBody
    const downloadBlockBlobResponse = await blobClient.download();
    const markdown = (
        await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
    ).toString();

    // [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
    async function streamToBuffer(readableStream) {
        return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
        });
    }

    return res.status(200).json({
        success: true,
        fileContent: markdown,
        postSummary: post.postSummary
    })
}

module.exports = allowCors(handler)