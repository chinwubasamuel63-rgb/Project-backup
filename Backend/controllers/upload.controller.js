import uploadToCloudinary from "../utils/uploadToCloudinary.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })} 

    const folder = req.body.folder || "devstream-nexus";

    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      image: {
        publicId: result.public_id,
        url: result.secure_url,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
