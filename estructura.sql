-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: sistema_cursos_fhce
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `aprobacion`
--

DROP TABLE IF EXISTS `aprobacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aprobacion` (
  `id_aprobacion` bigint NOT NULL AUTO_INCREMENT,
  `id_plantilla` bigint NOT NULL,
  `id_coordinador` bigint NOT NULL COMMENT 'FK al usuario con rol COORDINADOR',
  `estado` enum('APROBADA','RECHAZADA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Resultado de la revisin del coordinador sobre esta versin de plantilla',
  `observaciones` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `fecha_revision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_aprobacion`),
  KEY `idx_plantilla` (`id_plantilla`),
  KEY `idx_coordinador` (`id_coordinador`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `aprobacion_ibfk_1` FOREIGN KEY (`id_plantilla`) REFERENCES `plantilla_certificado` (`id_plantilla`) ON DELETE CASCADE,
  CONSTRAINT `aprobacion_ibfk_2` FOREIGN KEY (`id_coordinador`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Revisión de plantilla por coordinador. Cada revisión genera un nuevo registro.';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_aprobar_plantilla` AFTER INSERT ON `aprobacion` FOR EACH ROW BEGIN

    DECLARE v_id_curso  BIGINT;
    DECLARE v_id_evento BIGINT;

    
    SELECT id_curso, id_evento
    INTO v_id_curso, v_id_evento
    FROM plantilla_certificado
    WHERE id_plantilla = NEW.id_plantilla;

    IF NEW.estado = 'APROBADA' THEN

        
        UPDATE plantilla_certificado
        SET estado = 'HISTORICA'
        WHERE estado = 'VIGENTE'
          AND id_plantilla != NEW.id_plantilla
          AND (
              (v_id_curso  IS NOT NULL AND id_curso  = v_id_curso)
              OR
              (v_id_evento IS NOT NULL AND id_evento = v_id_evento)
          );

        
        
        UPDATE plantilla_certificado
        SET estado = 'HISTORICA'
        WHERE estado = 'PENDIENTE'
          AND id_plantilla != NEW.id_plantilla
          AND (
              (v_id_curso  IS NOT NULL AND id_curso  = v_id_curso)
              OR
              (v_id_evento IS NOT NULL AND id_evento = v_id_evento)
          );

        
        UPDATE plantilla_certificado
        SET estado = 'VIGENTE'
        WHERE id_plantilla = NEW.id_plantilla;

    END IF;
    
    

END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `asistencia`
--

DROP TABLE IF EXISTS `asistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `asistencia` (
  `id_asistencia` bigint NOT NULL AUTO_INCREMENT,
  `id_inscripcion` bigint NOT NULL COMMENT 'Si existe el registro, el participante asistió',
  `registrado_por` bigint NOT NULL COMMENT 'Coordinador o auxiliar que registró la asistencia',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_asistencia`),
  UNIQUE KEY `id_inscripcion` (`id_inscripcion`),
  KEY `idx_registrado_por` (`registrado_por`),
  CONSTRAINT `asistencia_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE,
  CONSTRAINT `asistencia_ibfk_2` FOREIGN KEY (`registrado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de asistencia a evento. Existencia del registro = asistió.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auxiliar_evento`
--

DROP TABLE IF EXISTS `auxiliar_evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auxiliar_evento` (
  `id_auxiliar` bigint NOT NULL COMMENT 'FK al usuario con rol AUXILIAR',
  `id_evento` bigint NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_auxiliar`,`id_evento`),
  KEY `id_evento` (`id_evento`),
  CONSTRAINT `auxiliar_evento_ibfk_1` FOREIGN KEY (`id_auxiliar`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `auxiliar_evento_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla intermedia N:M — auxiliar × evento';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `c_anulacion`
--

DROP TABLE IF EXISTS `c_anulacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `c_anulacion` (
  `id_anulacion` bigint NOT NULL AUTO_INCREMENT,
  `id_certificado` bigint NOT NULL COMMENT 'Relación 1:1 con certificado',
  `id_usuario` bigint NOT NULL COMMENT 'Usuario que realizó la anulación',
  `motivo_anulacion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_certificado_reemplazo` bigint DEFAULT NULL COMMENT 'Nuevo certificado emitido (si aplica). Relación 1:1.',
  `fecha_anulacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_anulacion`),
  UNIQUE KEY `id_certificado` (`id_certificado`),
  KEY `id_certificado_reemplazo` (`id_certificado_reemplazo`),
  KEY `idx_usuario` (`id_usuario`),
  CONSTRAINT `c_anulacion_ibfk_1` FOREIGN KEY (`id_certificado`) REFERENCES `certificado` (`id_certificado`) ON DELETE CASCADE,
  CONSTRAINT `c_anulacion_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `c_anulacion_ibfk_3` FOREIGN KEY (`id_certificado_reemplazo`) REFERENCES `certificado` (`id_certificado`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anulación de certificado. id_certificado_reemplazo NULL si no hubo reemisión.';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = latin1 */ ;
/*!50003 SET character_set_results = latin1 */ ;
/*!50003 SET collation_connection  = latin1_swedish_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_anular_certificado` AFTER INSERT ON `c_anulacion` FOR EACH ROW BEGIN
    UPDATE certificado
    SET estado_emision = IF(
        NEW.id_certificado_reemplazo IS NULL,
        'ANULADO',
        'REEMITIDO'
    )
    WHERE id_certificado = NEW.id_certificado;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_marcar_reemitido` AFTER UPDATE ON `c_anulacion` FOR EACH ROW BEGIN
    IF NEW.id_certificado_reemplazo IS NOT NULL
       AND OLD.id_certificado_reemplazo IS NULL THEN
        UPDATE certificado
        SET estado_emision = 'REEMITIDO'
        WHERE id_certificado = NEW.id_certificado;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `carrera`
--

DROP TABLE IF EXISTS `carrera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carrera` (
  `id_carrera` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('ACTIVA','INACTIVA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  PRIMARY KEY (`id_carrera`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Carreras académicas de la FHCE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `certificado`
--

DROP TABLE IF EXISTS `certificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificado` (
  `id_certificado` bigint NOT NULL AUTO_INCREMENT,
  `id_inscripcion` bigint NOT NULL,
  `codigo_verificacion` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código único para verificación QR',
  `archivo_generado` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_emision` enum('GENERADO','ANULADO','REEMITIDO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERADO',
  `version` int NOT NULL DEFAULT '1' COMMENT 'Incrementa en cada reemisión',
  `fecha_emision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_certificado`),
  UNIQUE KEY `codigo_verificacion` (`codigo_verificacion`),
  KEY `idx_inscripcion` (`id_inscripcion`),
  KEY `idx_estado_emision` (`estado_emision`),
  KEY `idx_version` (`version`),
  CONSTRAINT `certificado_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Certificado digital emitido. Control de versiones para anulaciones y reemisiones.';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_validar_certificado` BEFORE INSERT ON `certificado` FOR EACH ROW BEGIN
    DECLARE es_curso INT DEFAULT 0;
    DECLARE cumple   INT DEFAULT 0;

    SELECT COUNT(*) INTO es_curso
    FROM inscripcion
    WHERE id_inscripcion = NEW.id_inscripcion AND id_curso IS NOT NULL;

    IF es_curso > 0 THEN
        SELECT COUNT(*) INTO cumple
        FROM evaluacion_estudiante
        WHERE id_inscripcion = NEW.id_inscripcion AND estado = 'APROBADO';
    ELSE
        SELECT COUNT(*) INTO cumple
        FROM asistencia
        WHERE id_inscripcion = NEW.id_inscripcion;
    END IF;

    IF cumple = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'El participante no cumple los requisitos para recibir un certificado';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `codigo_verificacion`
--

DROP TABLE IF EXISTS `codigo_verificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `codigo_verificacion` (
  `id_codigo` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `codigo` varchar(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('EMAIL','REGISTRO','RESET_PASSWORD') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` datetime NOT NULL COMMENT 'Válido por 24 horas desde la creación',
  `fecha_uso` datetime DEFAULT NULL COMMENT 'Momento en que fue ingresado por el usuario',
  PRIMARY KEY (`id_codigo`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_usado` (`usado`),
  CONSTRAINT `codigo_verificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=66 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Códigos de 6 dígitos para verificar email de usuarios externos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `coordinador_carrera`
--

DROP TABLE IF EXISTS `coordinador_carrera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coordinador_carrera` (
  `id_coordinador` bigint NOT NULL COMMENT 'FK al usuario con rol COORDINADOR',
  `id_carrera` bigint NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_coordinador`,`id_carrera`),
  KEY `id_carrera` (`id_carrera`),
  CONSTRAINT `coordinador_carrera_ibfk_1` FOREIGN KEY (`id_coordinador`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `coordinador_carrera_ibfk_2` FOREIGN KEY (`id_carrera`) REFERENCES `carrera` (`id_carrera`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla intermedia N:M — coordinador × carrera';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso` (
  `id_curso` bigint NOT NULL AUTO_INCREMENT,
  `id_carrera` bigint NOT NULL,
  `id_organizador` bigint NOT NULL COMMENT 'FK al usuario con rol COORDINADOR',
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `carga_horaria` int NOT NULL COMMENT 'Total de horas académicas',
  `duracion` int DEFAULT NULL,
  `unidad` enum('das','semanas','meses') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_inicio` date NOT NULL,
  `costo_externo` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio para participantes externos',
  `costo_umsa` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio preferencial UMSA',
  `nota_aprobacion` decimal(5,2) NOT NULL COMMENT 'Nota mínima para aprobar',
  `estado` enum('ABIERTO','LLENO','FINALIZADO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTO',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_disenador` bigint DEFAULT NULL,
  PRIMARY KEY (`id_curso`),
  KEY `idx_carrera` (`id_carrera`),
  KEY `idx_organizador` (`id_organizador`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_inicio`),
  KEY `idx_disenador` (`id_disenador`),
  CONSTRAINT `curso_ibfk_1` FOREIGN KEY (`id_carrera`) REFERENCES `carrera` (`id_carrera`) ON DELETE RESTRICT,
  CONSTRAINT `curso_ibfk_2` FOREIGN KEY (`id_organizador`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_curso_disenador` FOREIGN KEY (`id_disenador`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cursos complementarios. Certificación por aprobación de nota.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `docente`
--

DROP TABLE IF EXISTS `docente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente` (
  `id_usuario` bigint NOT NULL,
  `titulo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lic., MSc., PhD., etc.',
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `docente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Atributos específicos del rol DOCENTE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `evaluacion_estudiante`
--

DROP TABLE IF EXISTS `evaluacion_estudiante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evaluacion_estudiante` (
  `id_evaluacion` bigint NOT NULL AUTO_INCREMENT,
  `id_inscripcion` bigint NOT NULL COMMENT 'Relación 1:1 con inscripcion',
  `nota_final` decimal(5,2) NOT NULL COMMENT 'Nota sobre 100',
  `estado` enum('APROBADO','REPROBADO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion`),
  UNIQUE KEY `id_inscripcion` (`id_inscripcion`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `evaluacion_estudiante_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nota final de un participante en un curso. Relación 1:1 con inscripcion.';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_estado_evaluacion` BEFORE INSERT ON `evaluacion_estudiante` FOR EACH ROW BEGIN
    DECLARE nota_minima DECIMAL(5,2);

    SELECT c.nota_aprobacion INTO nota_minima
    FROM curso c
    JOIN inscripcion i ON i.id_curso = c.id_curso
    WHERE i.id_inscripcion = NEW.id_inscripcion;

    IF NEW.nota_final >= nota_minima THEN
        SET NEW.estado = 'APROBADO';
    ELSE
        SET NEW.estado = 'REPROBADO';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_update_estado_evaluacion` BEFORE UPDATE ON `evaluacion_estudiante` FOR EACH ROW BEGIN
    DECLARE nota_minima DECIMAL(5,2);

    SELECT c.nota_aprobacion INTO nota_minima
    FROM curso c
    JOIN inscripcion i ON i.id_curso = c.id_curso
    WHERE i.id_inscripcion = NEW.id_inscripcion;

    IF NEW.nota_final >= nota_minima THEN
        SET NEW.estado = 'APROBADO';
    ELSE
        SET NEW.estado = 'REPROBADO';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `evento`
--

DROP TABLE IF EXISTS `evento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `evento` (
  `id_evento` bigint NOT NULL AUTO_INCREMENT,
  `id_carrera` bigint NOT NULL,
  `id_organizador` bigint NOT NULL COMMENT 'FK al usuario con rol COORDINADOR',
  `nombre` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `carga_horaria` int NOT NULL COMMENT 'Total de horas académicas',
  `modalidad` enum('PRESENCIAL','VIRTUAL','MIXTO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` datetime NOT NULL COMMENT 'Fecha y hora del evento (un solo día)',
  `cupo_maximo` int DEFAULT NULL,
  `costo_externo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `costo_umsa` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('ABIERTO','LLENO','FINALIZADO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTO',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace a evento virtual (si aplica)',
  `lugar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_disenador` bigint DEFAULT NULL,
  PRIMARY KEY (`id_evento`),
  KEY `idx_carrera` (`id_carrera`),
  KEY `idx_organizador` (`id_organizador`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha_hora` (`fecha_hora`),
  KEY `idx_disenador` (`id_disenador`),
  CONSTRAINT `evento_ibfk_1` FOREIGN KEY (`id_carrera`) REFERENCES `carrera` (`id_carrera`) ON DELETE RESTRICT,
  CONSTRAINT `evento_ibfk_2` FOREIGN KEY (`id_organizador`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `fk_curso_disenador_evento` FOREIGN KEY (`id_disenador`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Eventos facultativos. Certificación por asistencia.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `id_historial` bigint NOT NULL AUTO_INCREMENT,
  `id_evaluacion` bigint NOT NULL,
  `nota_anterior` decimal(5,2) NOT NULL,
  `nota_nueva` decimal(5,2) NOT NULL,
  `motivo` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Justificación del cambio de nota',
  `cambiado_por` bigint NOT NULL COMMENT 'Usuario que realizó el cambio (administrador)',
  `fecha_cambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `cambiado_por` (`cambiado_por`),
  KEY `idx_evaluacion` (`id_evaluacion`),
  CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluacion_estudiante` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `historial_ibfk_2` FOREIGN KEY (`cambiado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoría de cambios de nota. Cada edición genera un nuevo registro.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inscripcion`
--

DROP TABLE IF EXISTS `inscripcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inscripcion` (
  `id_inscripcion` bigint NOT NULL AUTO_INCREMENT,
  `id_participante` bigint NOT NULL COMMENT 'FK al usuario con rol PARTICIPANTE',
  `id_curso` bigint DEFAULT NULL COMMENT 'NULL si es inscripción a evento',
  `id_evento` bigint DEFAULT NULL COMMENT 'NULL si es inscripción a curso',
  `codigo_paralelo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Con id_curso forma FK compuesta hacia paralelo',
  `tipo_precio` enum('UMSA','EXTERNO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `saldo` decimal(10,2) NOT NULL COMMENT 'Monto que debe pagar el participante',
  `fecha_inscripcion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('PENDIENTE','CONFIRMADA','CANCELADA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id_inscripcion`),
  UNIQUE KEY `uq_participante_curso` (`id_participante`,`id_curso`),
  UNIQUE KEY `uq_participante_evento` (`id_participante`,`id_evento`),
  KEY `id_curso` (`id_curso`,`codigo_paralelo`),
  KEY `idx_participante` (`id_participante`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_evento` (`id_evento`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `inscripcion_ibfk_1` FOREIGN KEY (`id_participante`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `inscripcion_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `inscripcion_ibfk_3` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE,
  CONSTRAINT `inscripcion_ibfk_4` FOREIGN KEY (`id_curso`, `codigo_paralelo`) REFERENCES `paralelo` (`id_curso`, `codigo`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=158 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inscripción de un participante a un curso o evento';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_validar_tipo_precio` BEFORE INSERT ON `inscripcion` FOR EACH ROW BEGIN
    DECLARE tipo_part ENUM('UMSA','EXTERNO');
    DECLARE es_gratis INT DEFAULT 0;

    
    IF NEW.id_curso IS NOT NULL THEN
        SELECT COUNT(*) INTO es_gratis
        FROM curso
        WHERE id_curso = NEW.id_curso AND costo_externo = 0 AND costo_umsa = 0;
    ELSE
        SELECT COUNT(*) INTO es_gratis
        FROM evento
        WHERE id_evento = NEW.id_evento AND costo_externo = 0 AND costo_umsa = 0;
    END IF;

    
    IF es_gratis = 0 THEN
        SELECT tipo_participante INTO tipo_part
        FROM participante
        WHERE id_usuario = NEW.id_participante;

        IF tipo_part != NEW.tipo_precio THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El tipo de precio no coincide con el tipo de participante';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_cupo_paralelo` AFTER UPDATE ON `inscripcion` FOR EACH ROW BEGIN
    DECLARE total_inscritos   INT;
    DECLARE cupo_par          INT;
    DECLARE paralelos_con_cupo INT;
    DECLARE paralelos_llenos  INT;

    IF NEW.estado = 'CONFIRMADA' AND OLD.estado != 'CONFIRMADA'
       AND NEW.id_curso IS NOT NULL AND NEW.codigo_paralelo IS NOT NULL THEN

        
        SELECT cupo_maximo INTO cupo_par
        FROM paralelo
        WHERE id_curso = NEW.id_curso AND codigo = NEW.codigo_paralelo;

        IF cupo_par IS NOT NULL THEN

            
            SELECT COUNT(*) INTO total_inscritos
            FROM inscripcion
            WHERE id_curso = NEW.id_curso
              AND codigo_paralelo = NEW.codigo_paralelo
              AND estado = 'CONFIRMADA';

            IF total_inscritos >= cupo_par THEN

                
                SELECT COUNT(*) INTO paralelos_con_cupo
                FROM paralelo
                WHERE id_curso = NEW.id_curso AND cupo_maximo IS NOT NULL;

                
                SELECT COUNT(*) INTO paralelos_llenos
                FROM paralelo p
                WHERE p.id_curso = NEW.id_curso
                  AND p.cupo_maximo IS NOT NULL
                  AND (
                      SELECT COUNT(*) FROM inscripcion i
                      WHERE i.id_curso = p.id_curso
                        AND i.codigo_paralelo = p.codigo
                        AND i.estado = 'CONFIRMADA'
                  ) >= p.cupo_maximo;

                
                IF paralelos_llenos >= paralelos_con_cupo THEN
                    UPDATE curso SET estado = 'LLENO'
                    WHERE id_curso = NEW.id_curso;
                END IF;

            END IF;
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_cupo_evento` AFTER UPDATE ON `inscripcion` FOR EACH ROW BEGIN
    DECLARE total_inscritos INT;
    DECLARE cupo_ev         INT;

    IF NEW.estado = 'CONFIRMADA' AND OLD.estado != 'CONFIRMADA'
       AND NEW.id_evento IS NOT NULL THEN

        SELECT cupo_maximo INTO cupo_ev
        FROM evento WHERE id_evento = NEW.id_evento;

        IF cupo_ev IS NOT NULL THEN
            SELECT COUNT(*) INTO total_inscritos
            FROM inscripcion
            WHERE id_evento = NEW.id_evento AND estado = 'CONFIRMADA';

            IF total_inscritos >= cupo_ev THEN
                UPDATE evento SET estado = 'LLENO'
                WHERE id_evento = NEW.id_evento;
            END IF;
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `pago`
--

DROP TABLE IF EXISTS `pago`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pago` (
  `id_pago` bigint NOT NULL AUTO_INCREMENT,
  `id_inscripcion` bigint NOT NULL,
  `monto` decimal(10,2) NOT NULL COMMENT 'Monto efectivamente pagado',
  `metodo_pago` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Método usado en pasarela Libélula',
  `referencia_transaccion` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID de transacción devuelto por Libélula',
  `identificador_deuda` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Identificador propio de la deuda, usado para volver a consultar el pago en Libélula',
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `fecha_pago` datetime DEFAULT NULL COMMENT 'Momento de confirmación del pago',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago`),
  UNIQUE KEY `uk_identificador_deuda` (`identificador_deuda`),
  KEY `idx_inscripcion` (`id_inscripcion`),
  KEY `idx_estado` (`estado`),
  KEY `idx_referencia` (`referencia_transaccion`),
  CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=141 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transacción de pago asociada a una inscripción';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_confirmar_inscripcion_por_pago` AFTER UPDATE ON `pago` FOR EACH ROW BEGIN
    IF NEW.estado = 'APROBADO' AND OLD.estado != 'APROBADO' THEN
        UPDATE inscripcion
        SET estado = 'CONFIRMADA'
        WHERE id_inscripcion = NEW.id_inscripcion
          AND estado = 'PENDIENTE';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `paralelo`
--

DROP TABLE IF EXISTS `paralelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paralelo` (
  `id_curso` bigint NOT NULL COMMENT 'Parte de PK compuesta — FK a curso',
  `codigo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clave parcial: A, B, 01, etc.',
  `id_docente` bigint DEFAULT NULL COMMENT 'FK al usuario con rol DOCENTE',
  `modalidad` enum('PRESENCIAL','VIRTUAL','MIXTO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cupo_maximo` int DEFAULT NULL,
  `horario_descripcion` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lugar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace a clase virtual (si aplica)',
  PRIMARY KEY (`id_curso`,`codigo`),
  KEY `idx_docente` (`id_docente`),
  CONSTRAINT `paralelo_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `paralelo_ibfk_2` FOREIGN KEY (`id_docente`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entidad débil de CURSO — clave compuesta (id_curso, codigo)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `participante`
--

DROP TABLE IF EXISTS `participante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participante` (
  `id_usuario` bigint NOT NULL,
  `tipo_participante` enum('UMSA','EXTERNO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Determina el precio aplicado en inscripción',
  PRIMARY KEY (`id_usuario`),
  KEY `idx_tipo` (`tipo_participante`),
  CONSTRAINT `participante_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Atributos específicos del rol PARTICIPANTE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `plantilla_certificado`
--

DROP TABLE IF EXISTS `plantilla_certificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantilla_certificado` (
  `id_plantilla` bigint NOT NULL AUTO_INCREMENT,
  `id_curso` bigint DEFAULT NULL COMMENT 'NULL si es plantilla de evento',
  `id_evento` bigint DEFAULT NULL COMMENT 'NULL si es plantilla de curso',
  `archivo_pdf` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta del archivo PDF subido',
  `version` int NOT NULL DEFAULT '1',
  `subida_por` bigint NOT NULL COMMENT 'FK al usuario con rol DISEÑADOR',
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('PENDIENTE','VIGENTE','HISTORICA') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id_plantilla`),
  KEY `subida_por` (`subida_por`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_evento` (`id_evento`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `plantilla_certificado_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `plantilla_certificado_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE,
  CONSTRAINT `plantilla_certificado_ibfk_3` FOREIGN KEY (`subida_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Plantilla PDF para certificados. Solo una VIGENTE por actividad.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `id_refresh` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `revocado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` datetime NOT NULL,
  PRIMARY KEY (`id_refresh`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_revocado` (`revocado`),
  CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49070 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ADMINISTRADOR|COORDINADOR|DOCENTE|PARTICIPANTE|AUXILIAR|DISEÑADOR',
  `descripcion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de roles del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `solicitud_emision`
--

DROP TABLE IF EXISTS `solicitud_emision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_emision` (
  `id_solicitud` bigint NOT NULL AUTO_INCREMENT,
  `id_curso` bigint DEFAULT NULL COMMENT 'NULL si es evento',
  `codigo_paralelo` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Con id_curso forma FK compuesta hacia paralelo',
  `id_evento` bigint DEFAULT NULL COMMENT 'NULL si es curso',
  `id_docente` bigint NOT NULL COMMENT 'Docente que confirmó las calificaciones',
  `cantidad_aprobados` int NOT NULL,
  `estado` enum('PENDIENTE','EN_PROCESO','COMPLETADO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `procesado_por` bigint DEFAULT NULL COMMENT 'Coordinador que procesó la solicitud',
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_procesamiento` datetime DEFAULT NULL,
  `notas` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'Observaciones adicionales del docente',
  PRIMARY KEY (`id_solicitud`),
  KEY `id_evento` (`id_evento`),
  KEY `procesado_por` (`procesado_por`),
  KEY `id_curso` (`id_curso`,`codigo_paralelo`),
  KEY `idx_estado` (`estado`),
  KEY `idx_docente` (`id_docente`),
  KEY `idx_fecha_solicitud` (`fecha_solicitud`),
  CONSTRAINT `solicitud_emision_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `solicitud_emision_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE,
  CONSTRAINT `solicitud_emision_ibfk_3` FOREIGN KEY (`id_docente`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `solicitud_emision_ibfk_4` FOREIGN KEY (`procesado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL,
  CONSTRAINT `solicitud_emision_ibfk_5` FOREIGN KEY (`id_curso`, `codigo_paralelo`) REFERENCES `paralelo` (`id_curso`, `codigo`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generada cuando el docente confirma notas. Flujo: PENDIENTE→EN_PROCESO→COMPLETADO';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'RU para UMSA; username para externos',
  `nombres` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `ci` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo externos; NULL para usuarios UMSA',
  `estado` enum('ACTIVO','INACTIVO') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=1090 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entidad base de la jerarquía de usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuario_rol`
--

DROP TABLE IF EXISTS `usuario_rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_rol` (
  `id_usuario` bigint NOT NULL,
  `id_rol` bigint NOT NULL,
  `fecha_asignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `asignado_por` bigint DEFAULT NULL COMMENT 'Usuario (administrador) que asignó el rol',
  PRIMARY KEY (`id_usuario`,`id_rol`),
  KEY `asignado_por` (`asignado_por`),
  KEY `idx_rol` (`id_rol`),
  CONSTRAINT `usuario_rol_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `usuario_rol_ibfk_2` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE CASCADE,
  CONSTRAINT `usuario_rol_ibfk_3` FOREIGN KEY (`asignado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabla intermedia N:M — usuario × rol';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'sistema_cursos_fhce'
--

--
-- Dumping routines for database 'sistema_cursos_fhce'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-22  7:31:09
