import cloudinaryPkg from "cloudinary";
import fs from "fs";

const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
    // cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    // api_key: process.env.CLOUDINARY_API_KEY,
    // api_secret: process.env.CLOUDINARY_API_SECRET,

    cloud_name:"dusvarmgw",
    api_key: 373154371666665,
    api_secret: "0wl4BSfkmJ-EY6De1F7-0etfWhg",
});

const uploadOnCloudinary = async (localFilePath, type = "auto") => {
    try {
        if (!localFilePath) return null;

        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: type,
        });

        fs.unlinkSync(localFilePath);
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return error;
    }
};

const uploadToCloudinary = async (file) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    if (!fs.existsSync(file.path)) {
      throw new Error('File not found in temporary storage');
    }

    console.log(`Uploading: ${file.originalname} (${file.mimetype})`);

    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: 'auto',
      folder: "uploads",
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });

    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return result;

  } catch (error) {
    console.error('Cloudinary Upload Failed:', {
      file: file?.originalname,
      error: error.message,
      http_code: error.http_code,
      name: error.name
    });

    if (file && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    if (error.http_code === 400) {
      throw new Error(`Unsupported file format: ${file.originalname}. Please try a different file.`);
    } else if (error.http_code === 413) {
      throw new Error('File too large. Please reduce file size and try again.');
    } else {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
};

const deleteOnCloudinary = async (public_id, resource_type="image") => {
    try {
        if (!public_id) return null;

        await cloudinary.uploader.destroy(public_id, {
            resource_type: `${resource_type}`
        });
    } catch (error) {
        return error;
    }
}

export {uploadOnCloudinary,deleteOnCloudinary,uploadToCloudinary};





