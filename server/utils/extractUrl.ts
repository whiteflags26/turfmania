export const extractPublicIdFromUrl = (url: string): string | null => {
  try {
    const regex = 
      /cloudinary\.com\/[^/]+\/image\/upload\/(?:v\d+\/)?(.+)(?:\.[^.]+)$/; // Match the pattern: cloudinary.com/[cloud_name]/image/upload/v[version]/[public_id].[extension]
    const match = regex.exec(url);
    return match ? match[1] : null;
  } catch (error) {
    return null;
  }
};
