package bo.edu.umsa.fhce.sistemacursos.modules.archivo.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import bo.edu.umsa.fhce.sistemacursos.exception.BusinessException;
import lombok.Getter;

@Service
public class ArchivoStorageService {

    @Value("${app.archivos.directorio:uploads}")
    private String uploadDir;

    @Value("${app.archivos.max-size-mb:5}")
    private long maxSizeMb;

    public StoredFile storeImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("Debes subir un archivo de imagen", 400);
        }

        long maxBytes = maxSizeMb * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new BusinessException("La imagen excede el tamanio maximo permitido", 400);
        }

        // El Content-Type que manda el cliente es falsificable — se detecta
        // el formato real por los primeros bytes del archivo (igual que
        // PlantillaService.tieneFirmaPdf()), y la extensión sale de ahí,
        // nunca del nombre de archivo que mandó el cliente.
        String extensionReal = detectarExtensionImagen(file);
        if (extensionReal == null) {
            throw new BusinessException(
                "El archivo debe ser una imagen válida (JPG, PNG, GIF o WEBP)", 400);
        }

        String filename = UUID.randomUUID() + "." + extensionReal;

        Path baseDir = Paths.get(uploadDir, "actividades").toAbsolutePath().normalize();
        Path destination = baseDir.resolve(filename);

        try {
            Files.createDirectories(baseDir);
            file.transferTo(destination.toFile());
        } catch (IOException ex) {
            throw new BusinessException("No se pudo guardar la imagen", 500);
        }

        return new StoredFile(filename, "actividades/" + filename);
    }

    // Detecta el formato real leyendo los primeros bytes del archivo
    // (magic numbers), no el Content-Type ni el nombre — ambos los controla
    // quien sube el archivo y se pueden falsificar.
    private String detectarExtensionImagen(MultipartFile file) {
        byte[] header = new byte[12];
        int read;
        try (InputStream input = file.getInputStream()) {
            read = input.read(header);
        } catch (IOException e) {
            return null;
        }
        if (read < 4) {
            return null;
        }

        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        if (read >= 8
                && (header[0] & 0xFF) == 0x89 && header[1] == 'P' && header[2] == 'N' && header[3] == 'G'
                && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A) {
            return "png";
        }
        if (header[0] == 'G' && header[1] == 'I' && header[2] == 'F' && header[3] == '8') {
            return "gif";
        }
        if (read == 12
                && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') {
            return "webp";
        }
        return null;
    }

    @Getter
    public static class StoredFile {
        private final String filename;
        private final String relativePath;

        public StoredFile(String filename, String relativePath) {
            this.filename = filename;
            this.relativePath = relativePath;
        }
    }
}
