export default async function handler(req, res) {
    return res.status(404).json({ success: false, error: "No user endpoint specified!"})
}