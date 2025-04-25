import { CreateRequestDto } from "@/types/organization";

export async function createOrganizationRequest(
  data: CreateRequestDto,
  imageFiles?: File[]
) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      throw new Error("API URL is not defined. Check your environment variables.");
    }

    // If we have image files, use FormData
    if (imageFiles && imageFiles.length > 0) {
      const formData = new FormData();
      
      // Add organization data fields individually for better server compatibility
      formData.append('organizationName', data.organizationName);
      
      // Add facilities as individual entries
      data.facilities.forEach(facility => {
        formData.append('facilities', facility);
      });
      
      // Add location as JSON string
      formData.append('location', JSON.stringify(data.location));
      
      // Add other fields
      formData.append('contactPhone', data.contactPhone);
      formData.append('ownerEmail', data.ownerEmail);
      
      if (data.requestNotes) {
        formData.append('requestNotes', data.requestNotes);
      }
      
      // Add each image file with the name 'images'
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      
      console.log("Sending form data with images:", 
        `Total files: ${imageFiles.length}`, 
        `Fields: ${[...formData.keys()].join(', ')}`
      );
      
      const response = await fetch(
        `${apiUrl}/api/v1/organization-requests`,
        {
          method: "POST",
          credentials: "include", // Important for cookies
          // Don't set Content-Type header when using FormData
          body: formData,
        }
      );
      
      const result = await response.json();
      
      return {
        ok: response.ok,
        data: result
      };
    } 
    // No images, just use JSON
    else {
      const response = await fetch(
        `${apiUrl}/api/v1/organization-requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );
      
      const result = await response.json();
      
      return {
        ok: response.ok,
        data: result
      };
    }
  } catch (error) {
    console.error("API request failed:", error);
    return {
      ok: false,
      data: { message: error instanceof Error ? error.message : "Failed to connect to the server" }
    };
  }
}