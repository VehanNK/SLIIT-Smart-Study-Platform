package com.sliit.studyhub.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public String uploadFile(MultipartFile file) throws IOException {
        // Cloudinary needs the actual File object to preserve the original .ext (like .docx, .pdf)
        // because file.getBytes() strips away the filename and extension metadata.
        java.io.File convFile = new java.io.File(System.getProperty("java.io.tmpdir") + "/" + file.getOriginalFilename());
        try (java.io.FileOutputStream fos = new java.io.FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }

        // Upload to Cloudinary, explicitly telling it to keep the filename and dynamically assign resource_type
        Map<?, ?> uploadResult = cloudinary.uploader().upload(convFile, ObjectUtils.asMap(
                "resource_type", "auto",
                "use_filename", true,
                "unique_filename", true
        ));

        // Delete the temporary file from the server
        convFile.delete();

        return uploadResult.get("secure_url").toString();
    }
}
