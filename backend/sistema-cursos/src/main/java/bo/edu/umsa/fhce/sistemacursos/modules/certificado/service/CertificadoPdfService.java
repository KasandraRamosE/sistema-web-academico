// src/main/java/.../modules/certificado/service/CertificadoPdfService.java

package bo.edu.umsa.fhce.sistemacursos.modules.certificado.service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfReader;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Image;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.properties.TextAlignment;

import bo.edu.umsa.fhce.sistemacursos.modules.certificado.entity.Certificado;
import bo.edu.umsa.fhce.sistemacursos.modules.evaluacion.repository.EvaluacionRepository;
import bo.edu.umsa.fhce.sistemacursos.modules.inscripcion.entity.Inscripcion;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class CertificadoPdfService {

    private final QrService             qrService;
    private final EvaluacionRepository  evaluacionRepository;

    @Value("${app.certificados.directorio:certificados}")
    private String directorioCertificados;

    @Value("${app.email.base-url}")
    private String baseUrl;

    // Coordenadas fijas (carta horizontal)

    private static final float ANCHO_PAGINA   = 792f; // carta horizontal
    private static final float ALTO_PAGINA    = 612f;
    private static final int   NUM_PAGINA     = 1;

    // Posiciones Y (desde el borde inferior)
    private static final float Y_NOMBRE       = 290f; // nombre participante — centro
    private static final float Y_ACTIVIDAD    = 245f; // nombre del curso o evento
    private static final float Y_CARGA        = 210f; // carga horaria
    private static final float Y_NOTA         = 180f; // nota final (solo cursos)
    private static final float Y_FECHA        = 150f; // fecha de emisión
    private static final float Y_VERSION      = 132f; // versión (solo reemisiones)

    // QR
    private static final float QR_SIZE        = 80f;
    private static final float QR_X           = 672f; // 792 - 80 - 40 margen
    private static final float QR_Y           = 30f;

    // URL
    private static final float URL_X          = 570f;
    private static final float URL_Y          = 18f;
    private static final float URL_ANCHO      = 210f;

    public String generarYGuardar(Certificado certificado, String rutaPlantilla) {
        try {
            byte[] pdfBytes = generarPdf(certificado, rutaPlantilla);

            Path dirPath = Paths.get(directorioCertificados);
            Files.createDirectories(dirPath);

            String nombreArchivo = String.format("cert_%d_v%d.pdf",
                certificado.getIdCertificado(),
                certificado.getVersion());

            Path rutaArchivo = dirPath.resolve(nombreArchivo);
            Files.write(rutaArchivo, pdfBytes);

            log.info("PDF generado: {}", rutaArchivo);
            return rutaArchivo.toString();

        } catch (IOException e) {
            log.error("Error guardando PDF del certificado {}",
                certificado.getIdCertificado(), e);
            throw new RuntimeException("Error generando certificado PDF", e);
        }
    }

    public byte[] generarParaDescarga(Certificado certificado, String rutaPlantilla) {
        try {
            return generarPdf(certificado, rutaPlantilla);
        } catch (IOException e) {
            throw new RuntimeException("Error generando PDF para descarga", e);
        }
    }

    private byte[] generarPdf(Certificado certificado,
                               String rutaPlantilla) throws IOException {

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Inscripcion inscripcion = certificado.getInscripcion();

        byte[] plantillaBytes = Files.readAllBytes(Paths.get(rutaPlantilla));

        PdfReader reader = new PdfReader(new ByteArrayInputStream(plantillaBytes));
        PdfWriter writer = new PdfWriter(outputStream);
        PdfDocument pdfDoc = new PdfDocument(reader, writer);

        Document document = new Document(pdfDoc, PageSize.LETTER.rotate());
        document.setMargins(0, 0, 0, 0);

        PdfFont fontBold = PdfFontFactory.createFont(
            com.itextpdf.io.font.constants.StandardFonts.HELVETICA_BOLD);
        PdfFont fontNormal = PdfFontFactory.createFont(
            com.itextpdf.io.font.constants.StandardFonts.HELVETICA);

        String nombreParticipante = buildNombreParticipante(inscripcion);
        addCenteredText(document, nombreParticipante, fontBold, 20, Y_NOMBRE);

        String nombreActividad = buildNombreActividad(inscripcion);
        addCenteredText(document, nombreActividad, fontBold, 14, Y_ACTIVIDAD);

        String cargaHoraria = buildCargaHoraria(inscripcion);
        addCenteredText(document, cargaHoraria, fontNormal, 12, Y_CARGA);

        addNotaFinalIfCurso(document, inscripcion, fontBold);

        String fecha = formatFechaEmision(certificado);
        addCenteredText(document, "La Paz, " + fecha, fontNormal, 11, Y_FECHA);

        addVersionIfReemision(document, certificado, fontNormal);

        String urlVerificacion = buildUrlVerificacion(certificado);
        addQr(document, urlVerificacion);
        addUrlTexto(document, urlVerificacion, fontNormal);

        document.close();
        return outputStream.toByteArray();
    }

    private String buildNombreParticipante(Inscripcion inscripcion) {
        return inscripcion.getParticipante().getNombres().toUpperCase()
            + " " + inscripcion.getParticipante().getApellidos().toUpperCase();
    }

    private String buildNombreActividad(Inscripcion inscripcion) {
        return inscripcion.getCurso() != null
            ? inscripcion.getCurso().getNombre()
            : inscripcion.getEvento().getNombre();
    }

    private String buildCargaHoraria(Inscripcion inscripcion) {
        Integer cargaHoraria = inscripcion.getCurso() != null
            ? inscripcion.getCurso().getCargaHoraria()
            : inscripcion.getEvento().getCargaHoraria();
        return cargaHoraria + " horas académicas";
    }

    private void addNotaFinalIfCurso(Document document,
                                     Inscripcion inscripcion,
                                     PdfFont fontBold) {
        if (inscripcion.getCurso() == null) {
            return;
        }

        evaluacionRepository
            .findByInscripcion_IdInscripcion(inscripcion.getIdInscripcion())
            .ifPresent(eval -> addCenteredText(document,
                "Nota final: " + eval.getNotaFinal() + " / 100",
                fontBold, 12, Y_NOTA));
    }

    private String formatFechaEmision(Certificado certificado) {
        return certificado.getFechaEmision()
            .format(DateTimeFormatter.ofPattern(
                "dd 'de' MMMM 'de' yyyy", new Locale("es", "BO")));
    }

    private void addVersionIfReemision(Document document,
                                       Certificado certificado,
                                       PdfFont fontNormal) {
        if (certificado.getVersion() <= 1) {
            return;
        }

        Paragraph version = new Paragraph(
                "(Reemisión — Versión " + certificado.getVersion() + ")")
            .setFont(fontNormal)
            .setFontSize(9)
            .setFontColor(ColorConstants.GRAY)
            .setTextAlignment(TextAlignment.CENTER)
            .setFixedPosition(NUM_PAGINA, 0, Y_VERSION, ANCHO_PAGINA);
        document.add(version);
    }

    private String buildUrlVerificacion(Certificado certificado) {
        return baseUrl + "/verificar/" + certificado.getCodigoVerificacion();
    }

    private void addQr(Document document, String urlVerificacion) {
        byte[] qrBytes = qrService.generarQr(urlVerificacion, 200);
        Image qrImage = new Image(ImageDataFactory.create(qrBytes));
        qrImage.setWidth(QR_SIZE).setHeight(QR_SIZE);
        qrImage.setFixedPosition(NUM_PAGINA, QR_X, QR_Y);
        document.add(qrImage);
    }

    private void addUrlTexto(Document document,
                             String urlVerificacion,
                             PdfFont fontNormal) {
        Paragraph url = new Paragraph(urlVerificacion)
            .setFont(fontNormal)
            .setFontSize(6)
            .setFontColor(ColorConstants.GRAY)
            .setFixedPosition(NUM_PAGINA, URL_X, URL_Y, URL_ANCHO);
        document.add(url);
    }

    private void addCenteredText(Document document,
                                 String text,
                                 PdfFont font,
                                 int fontSize,
                                 float y) {
        Paragraph paragraph = new Paragraph(text)
            .setFont(font)
            .setFontSize(fontSize)
            .setTextAlignment(TextAlignment.CENTER)
            .setFixedPosition(NUM_PAGINA, 0, y, ANCHO_PAGINA);
        document.add(paragraph);
    }
}