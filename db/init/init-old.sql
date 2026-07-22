Enter password: 
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
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `fecha_revision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_aprobacion`),
  KEY `idx_plantilla` (`id_plantilla`),
  KEY `idx_coordinador` (`id_coordinador`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `aprobacion_ibfk_1` FOREIGN KEY (`id_plantilla`) REFERENCES `plantilla_certificado` (`id_plantilla`) ON DELETE CASCADE,
  CONSTRAINT `aprobacion_ibfk_2` FOREIGN KEY (`id_coordinador`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Revisión de plantilla por coordinador. Cada revisión genera un nuevo registro.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aprobacion`
--

LOCK TABLES `aprobacion` WRITE;
/*!40000 ALTER TABLE `aprobacion` DISABLE KEYS */;
INSERT INTO `aprobacion` VALUES (1,1,4,'APROBADA','','2026-04-06 15:15:57'),(2,2,4,'RECHAZADA','esta en vertical, debe ser en formato horizontal','2026-05-08 22:31:40'),(3,3,4,'RECHAZADA','que sea verde','2026-05-09 18:44:57'),(4,4,4,'APROBADA','','2026-05-09 19:35:12');
/*!40000 ALTER TABLE `aprobacion` ENABLE KEYS */;
UNLOCK TABLES;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Registro de asistencia a evento. Existencia del registro = asistió.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `asistencia`
--

LOCK TABLES `asistencia` WRITE;
/*!40000 ALTER TABLE `asistencia` DISABLE KEYS */;
INSERT INTO `asistencia` VALUES (3,1,1,'2026-04-07 15:42:41'),(16,8,24,'2026-05-08 18:54:03'),(17,16,24,'2026-05-08 18:54:05');
/*!40000 ALTER TABLE `asistencia` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `auxiliar_evento`
--

LOCK TABLES `auxiliar_evento` WRITE;
/*!40000 ALTER TABLE `auxiliar_evento` DISABLE KEYS */;
INSERT INTO `auxiliar_evento` VALUES (4,1,'2026-03-31 16:14:41'),(6,1,'2026-04-09 17:07:19'),(8,4,'2026-04-30 03:47:16'),(11,4,'2026-04-30 03:51:34'),(13,1,'2026-04-30 08:47:00'),(18,1,'2026-04-28 15:35:27'),(24,4,'2026-05-07 08:37:19'),(25,4,'2026-04-30 03:52:25'),(25,5,'2026-04-30 04:05:47'),(25,7,'2026-04-30 04:06:06');
/*!40000 ALTER TABLE `auxiliar_evento` ENABLE KEYS */;
UNLOCK TABLES;

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
  `motivo_anulacion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_certificado_reemplazo` bigint DEFAULT NULL COMMENT 'Nuevo certificado emitido (si aplica). Relación 1:1.',
  `fecha_anulacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_anulacion`),
  UNIQUE KEY `id_certificado` (`id_certificado`),
  KEY `id_certificado_reemplazo` (`id_certificado_reemplazo`),
  KEY `idx_usuario` (`id_usuario`),
  CONSTRAINT `c_anulacion_ibfk_1` FOREIGN KEY (`id_certificado`) REFERENCES `certificado` (`id_certificado`) ON DELETE CASCADE,
  CONSTRAINT `c_anulacion_ibfk_2` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT,
  CONSTRAINT `c_anulacion_ibfk_3` FOREIGN KEY (`id_certificado_reemplazo`) REFERENCES `certificado` (`id_certificado`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Anulación de certificado. id_certificado_reemplazo NULL si no hubo reemisión.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `c_anulacion`
--

LOCK TABLES `c_anulacion` WRITE;
/*!40000 ALTER TABLE `c_anulacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `c_anulacion` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_anular_certificado` AFTER INSERT ON `c_anulacion` FOR EACH ROW BEGIN
    UPDATE certificado
    SET estado_emision = 'ANULADO'
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
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado` enum('ACTIVA','INACTIVA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  PRIMARY KEY (`id_carrera`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Carreras académicas de la FHCE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carrera`
--

LOCK TABLES `carrera` WRITE;
/*!40000 ALTER TABLE `carrera` DISABLE KEYS */;
INSERT INTO `carrera` VALUES (1,'Historia','ACTIVA'),(2,'Filosofía','ACTIVA'),(3,'Turismo','ACTIVA'),(4,'Literatura','ACTIVA'),(5,'Psicología','ACTIVA'),(6,'Lingüística e Idiomas','ACTIVA'),(7,'Ciencias de la Educación','ACTIVA'),(8,'Ciencias de la Información','ACTIVA');
/*!40000 ALTER TABLE `carrera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificado`
--

DROP TABLE IF EXISTS `certificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificado` (
  `id_certificado` bigint NOT NULL AUTO_INCREMENT,
  `id_inscripcion` bigint NOT NULL,
  `codigo_verificacion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Código único para verificación QR',
  `archivo_generado` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado_emision` enum('GENERADO','ANULADO','REEMITIDO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERADO',
  `version` int NOT NULL DEFAULT '1' COMMENT 'Incrementa en cada reemisión',
  `fecha_emision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_certificado`),
  UNIQUE KEY `codigo_verificacion` (`codigo_verificacion`),
  KEY `idx_inscripcion` (`id_inscripcion`),
  KEY `idx_estado_emision` (`estado_emision`),
  KEY `idx_version` (`version`),
  CONSTRAINT `certificado_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Certificado digital emitido. Control de versiones para anulaciones y reemisiones.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificado`
--

LOCK TABLES `certificado` WRITE;
/*!40000 ALTER TABLE `certificado` DISABLE KEYS */;
INSERT INTO `certificado` VALUES (1,2,'93b4eb3b-fb9c-4cf8-b26a-53b0ba1f5076','certificados\\cert_1_v1.pdf','GENERADO',1,'2026-04-06 15:20:54'),(2,8,'72689a6f-e65c-439d-b0ae-9e6654214668','certificados\\cert_2_v1.pdf','GENERADO',1,'2026-05-09 22:29:44'),(3,16,'31f07dfc-01bc-46c0-9851-cc5f3796b121','certificados\\cert_3_v1.pdf','GENERADO',1,'2026-05-09 22:29:45');
/*!40000 ALTER TABLE `certificado` ENABLE KEYS */;
UNLOCK TABLES;
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
  `codigo` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('EMAIL','REGISTRO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` datetime NOT NULL COMMENT 'Válido por 24 horas desde la creación',
  `fecha_uso` datetime DEFAULT NULL COMMENT 'Momento en que fue ingresado por el usuario',
  PRIMARY KEY (`id_codigo`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_codigo` (`codigo`),
  KEY `idx_usado` (`usado`),
  CONSTRAINT `codigo_verificacion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Códigos de 6 dígitos para verificar email de usuarios externos';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `codigo_verificacion`
--

LOCK TABLES `codigo_verificacion` WRITE;
/*!40000 ALTER TABLE `codigo_verificacion` DISABLE KEYS */;
INSERT INTO `codigo_verificacion` VALUES (1,4,'116749','REGISTRO',1,'2026-03-23 01:04:55','2026-03-24 01:04:55','2026-03-23 01:06:33'),(2,5,'748709','REGISTRO',1,'2026-03-24 12:09:53','2026-03-25 12:09:53','2026-03-24 12:10:26'),(3,6,'924350','REGISTRO',1,'2026-03-31 16:19:27','2026-04-01 16:19:27','2026-03-31 16:20:33'),(4,7,'301095','REGISTRO',0,'2026-04-06 16:31:53','2026-04-07 16:31:53',NULL),(5,8,'616153','REGISTRO',1,'2026-04-13 15:27:02','2026-04-14 15:27:02',NULL),(6,8,'497574','REGISTRO',0,'2026-04-13 15:30:56','2026-04-14 15:30:56',NULL),(7,11,'988939','REGISTRO',0,'2026-04-13 15:44:20','2026-04-14 15:44:20',NULL),(8,13,'215318','REGISTRO',1,'2026-04-14 09:37:30','2026-04-15 09:37:30','2026-04-14 09:38:40'),(9,14,'553680','REGISTRO',1,'2026-04-14 09:46:56','2026-04-15 09:46:56',NULL),(10,14,'321658','REGISTRO',1,'2026-04-14 09:48:52','2026-04-15 09:48:52',NULL),(11,14,'858433','REGISTRO',1,'2026-04-14 09:49:06','2026-04-15 09:49:06',NULL),(12,14,'977554','REGISTRO',0,'2026-04-14 10:34:43','2026-04-15 10:34:43',NULL),(13,15,'979456','REGISTRO',1,'2026-04-14 10:41:03','2026-04-15 10:41:03','2026-04-14 10:41:47'),(14,16,'492236','REGISTRO',1,'2026-04-14 15:18:06','2026-04-15 15:18:06','2026-04-14 15:18:48'),(15,18,'881034','REGISTRO',1,'2026-04-28 13:08:35','2026-04-29 13:08:35',NULL),(16,18,'592191','REGISTRO',1,'2026-04-28 13:11:29','2026-04-29 13:11:29',NULL),(17,18,'216452','REGISTRO',1,'2026-04-28 13:11:35','2026-04-29 13:11:35',NULL),(18,18,'202664','REGISTRO',1,'2026-04-28 13:11:40','2026-04-29 13:11:40',NULL),(19,18,'627295','REGISTRO',1,'2026-04-28 13:11:45','2026-04-29 13:11:45',NULL),(20,18,'124321','REGISTRO',1,'2026-04-28 13:11:50','2026-04-29 13:11:50',NULL),(21,18,'125482','REGISTRO',1,'2026-04-28 13:11:55','2026-04-29 13:11:55',NULL),(22,18,'305417','REGISTRO',1,'2026-04-28 13:12:00','2026-04-29 13:12:00',NULL),(23,18,'668754','REGISTRO',1,'2026-04-28 13:12:05','2026-04-29 13:12:05',NULL),(24,18,'519094','REGISTRO',1,'2026-04-28 13:16:32','2026-04-29 13:16:32',NULL),(25,18,'819924','REGISTRO',1,'2026-04-28 13:16:39','2026-04-29 13:16:39','2026-04-28 13:18:02'),(27,24,'355422','REGISTRO',1,'2026-04-28 17:21:17','2026-04-29 17:21:17','2026-04-28 17:22:01'),(28,25,'926994','REGISTRO',1,'2026-04-30 02:38:18','2026-05-01 02:38:18','2026-04-30 02:39:02'),(29,26,'668343','REGISTRO',0,'2026-04-30 03:27:07','2026-05-01 03:27:07',NULL),(30,27,'588125','REGISTRO',1,'2026-04-30 03:31:32','2026-05-01 03:31:32','2026-04-30 03:41:24'),(31,29,'928099','REGISTRO',0,'2026-05-12 07:54:22','2026-05-13 07:54:22',NULL),(32,30,'775012','REGISTRO',1,'2026-05-12 11:55:41','2026-05-13 11:55:41','2026-05-12 11:56:39');
/*!40000 ALTER TABLE `codigo_verificacion` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `coordinador_carrera`
--

LOCK TABLES `coordinador_carrera` WRITE;
/*!40000 ALTER TABLE `coordinador_carrera` DISABLE KEYS */;
INSERT INTO `coordinador_carrera` VALUES (4,1,'2026-03-26 00:02:05'),(4,4,'2026-04-09 15:38:07'),(6,3,'2026-04-06 17:16:42'),(18,5,'2026-04-28 15:34:17');
/*!40000 ALTER TABLE `coordinador_carrera` ENABLE KEYS */;
UNLOCK TABLES;

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
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `carga_horaria` int NOT NULL COMMENT 'Total de horas académicas',
  `fecha_inicio` date NOT NULL,
  `costo_externo` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio para participantes externos',
  `costo_umsa` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT 'Precio preferencial UMSA',
  `nota_aprobacion` decimal(5,2) NOT NULL COMMENT 'Nota mínima para aprobar',
  `estado` enum('ABIERTO','LLENO','FINALIZADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTO',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cursos complementarios. Certificación por aprobación de nota.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
INSERT INTO `curso` VALUES (1,4,1,'Taller de Redacción Académica','Curso intensivo de escritura académica',40,'2026-04-17',250.00,150.00,51.00,'ABIERTO','2026-03-26 01:31:36',NULL,6),(3,1,4,'Archivística e Historia Documental','El curso aborda los fundamentos teóricos y metodológicos de la archivística como disciplina auxiliar de la historia. Los participantes aprenderán a identificar, clasificar, describir y conservar documentos históricos en archivos públicos e institucionales. Se trabajará con el Archivo de La Paz, el Archivo Nacional de Bolivia y fuentes eclesiásticas coloniales como casos de estudio prácticos. Se incluye introducción a la paleografía para la lectura de documentos manuscritos del período colonial y republicano temprano, así como nociones básicas de conservación preventiva de documentos en papel y fotografías antiguas. Al finalizar, el participante será capaz de organizar un fondo documental básico y elaborar instrumentos de descripción archivística conforme a normas ISAD(G).',40,'2026-05-28',620.00,240.00,51.00,'ABIERTO','2026-04-14 12:26:29',NULL,6),(4,1,4,'Historia Económica de Bolivia: Siglos XIX y XX','Análisis de los procesos económicos que marcaron la formación del Estado boliviano desde la independencia hasta la Revolución Nacional de 1952 y sus consecuencias hasta finales del siglo XX. Se estudian los ciclos de la plata y el estaño, la economía del caucho, la Guerra del Chaco y su impacto económico-social, la reforma agraria de 1953 y la nacionalización de las minas. El curso incorpora el uso de fuentes estadísticas históricas, memorias ministeriales y balances comerciales como herramientas de análisis. Se discuten además las interpretaciones historiográficas más relevantes desde la historia económica latinoamericana, poniendo en diálogo a autores bolivianos como Zavaleta Mercado, René Arze Aguirre y Herbert Klein con corrientes internacionales.',36,'2026-04-30',500.00,360.00,51.00,'ABIERTO','2026-04-14 12:47:31',NULL,NULL),(5,1,4,'Historia de los Pueblos Indígenas en los Andes','El curso ofrece una visión amplia y crítica de la historia de los pueblos indígenas andinos desde el período prehispánico hasta la época contemporánea. Se analizan las estructuras políticas, económicas y sociales del Tawantinsuyu, la conquista y colonización española, los sistemas de mita y encomienda, las rebeliones del siglo XVIII —especialmente Túpac Katari y Bartolina Sisa—, y los procesos de reconstitución de ayllus en el siglo XX. El curso se nutre de la etnohistoria y la historia oral como enfoques metodológicos complementarios a las fuentes escritas coloniales. Se presta especial atención a los debates sobre descolonización historiográfica y la producción intelectual indígena contemporánea en Bolivia, incluyendo autores como Fausto Reinaga, Silvia Rivera Cusicanqui y Pablo Mamani Ramirez.',48,'2026-04-18',680.00,580.00,51.00,'ABIERTO','2026-04-14 12:50:14',NULL,NULL),(6,1,4,'Taller de Fotografía Histórica y Fuentes Visuales','El taller explora la fotografía como fuente histórica primaria, abordando tanto su análisis crítico como su uso en la investigación y la divulgación histórica. Se estudian los orígenes de la fotografía en Bolivia (siglo XIX), las colecciones fotográficas del Archivo de La Paz, la Biblioteca y Archivo Histórico de la Asamblea Legislativa, y fondos privados. Los participantes aprenderán técnicas de lectura e interpretación de imágenes históricas, considerando el contexto de producción, la intencionalidad del fotógrafo, la circulación de las imágenes y su uso político. En la parte práctica se trabaja con digitalización básica, descripción de fondos fotográficos y elaboración de pies de foto académicos. El taller concluye con la elaboración individual de un análisis de una fotografía histórica seleccionada por el participante.',28,'2026-06-27',120.00,0.00,51.00,'ABIERTO','2026-04-14 12:53:12',NULL,NULL),(7,1,4,'Historia y Teoría de la Historiografía Latinoamericana','El curso recorre las principales corrientes y escuelas historiográficas que han marcado la producción histórica en América Latina desde el siglo XIX hasta la actualidad. Se analizan el positivismo y el historicismo del siglo XIX, el impacto de la Escuela de los Annales, el marxismo latinoamericano, la historia social británica, los estudios subalternos y el giro cultural en la historiografía reciente. Se discute el lugar de la historia boliviana dentro de estas corrientes, revisando obras fundamentales de autores nacionales como Humberto Vázquez Machicado, Josep Barnadas, Gustavo Rodríguez Ostria y Rossana Barragán. Los participantes elaborarán un ensayo historiográfico sobre un período o tema de su elección, aplicando los marcos teóricos discutidos durante el curso.',32,'2026-05-27',0.00,0.00,51.00,'ABIERTO','2026-04-14 14:00:49',NULL,NULL),(8,4,4,'Narrativa Boliviana del Siglo XX: Canon y Márgenes','El curso propone una lectura crítica y renovada de la narrativa boliviana del siglo XX, interrogando las categorías de canon literario, tradición y marginalidad en la producción literaria nacional. Se estudian obras fundamentales de autores como Alcides Arguedas, Jesús Lara, Óscar Cerruto, Adolfo Cárdenas, Wolfango Montes y Giovanna Rivero, entre otros, prestando atención a las tensiones entre modernismo y vanguardia, entre lo urbano y lo rural, y entre las literaturas escritas en español y en lenguas indígenas. El curso incorpora herramientas de la narratología, la crítica cultural y los estudios postcoloniales para el análisis de los textos. Se espera que los participantes produzcan reseñas críticas y un ensayo final que dialogue con al menos dos de las obras del programa.\nEl curso propone una lectura crítica y renovada de la narrativa boliviana del siglo XX, interrogando las categorías de canon literario, tradición y marginalidad en la producción literaria nacional. Se estudian obras fundamentales de autores como Alcides Arguedas, Jesús Lara, Óscar Cerruto, Adolfo Cárdenas, Wolfango Montes y Giovanna Rivero, entre otros, prestando atención a las tensiones entre modernismo y vanguardia, entre lo urbano y lo rural, y entre las literaturas escritas en español y en lenguas indígenas. El curso incorpora herramientas de la narratología, la crítica cultural y los estudios postcoloniales para el análisis de los textos. Se espera que los participantes produzcan reseñas críticas y un ensayo final que dialogue con al menos dos de las obras del programa.',36,'2026-07-17',500.00,400.00,51.00,'ABIERTO','2026-04-16 09:37:03',NULL,NULL),(9,4,4,'Taller de Escritura Creativa: Cuento y Microficción','Taller práctico de escritura creativa centrado en los géneros del cuento breve y la microficción, dos de las formas narrativas más dinámicas de la literatura latinoamericana contemporánea. A lo largo del taller se analiza el funcionamiento del cuento como forma —estructura, punto de vista, tiempo, diálogo, cierre—, con lecturas de autores como Quiroga, Cortázar, Monterroso, Ana María Shua, Edmundo Paz Soldán y Magela Baudoin. Cada sesión combina la lectura comentada de textos de referencia con ejercicios de escritura individual que son discutidos en taller colectivo bajo criterios de lectura crítica constructiva. Al finalizar, cada participante habrá producido un portafolio de al menos cinco cuentos y diez microficciones revisados y trabajados en profundidad durante el proceso creativo.',48,'2026-09-10',400.00,320.00,51.00,'ABIERTO','2026-04-16 11:01:17',NULL,NULL),(10,4,4,'Literatura Latinoamericana: Del Boom a la Narrativa del Siglo XXI','El curso ofrece un recorrido por la narrativa latinoamericana desde el fenómeno editorial y estético del Boom (décadas de 1960–1970) hasta las tendencias más recientes de la literatura del continente en el siglo XXI. Se estudian obras de García Márquez, Vargas Llosa, Fuentes, Cortázar y Donoso como representantes del Boom, para luego analizar las rupturas generacionales del post-Boom, el McOndo, el Crack y las narrativas del nuevo siglo. Se presta especial atención a la producción de escritoras latinoamericanas que han reconfigurado el campo literario en las últimas décadas: Mariana Enriquez, Fernanda Melchor, Samanta Schweblin, Mónica Ojeda y Giovanna Rivero. El curso propone una lectura comparada que atiende tanto a la forma estética como a los contextos sociales, políticos y de mercado editorial en los que emergen estas obras.',40,'2026-08-06',300.00,280.00,51.00,'ABIERTO','2026-04-16 11:02:56',NULL,NULL),(11,4,4,'Introducción a la Teoría Literaria','Curso introductorio a los principales marcos teóricos y metodológicos para el análisis literario, dirigido a estudiantes de literatura, comunicación, educación y humanidades en general. Se recorren las escuelas y corrientes más influyentes de la teoría literaria del siglo XX y XXI: formalismo ruso, New Criticism, estructuralismo, semiótica, narratología, hermenéutica, deconstrucción, teoría feminista, estudios culturales y estudios postcoloniales. Cada corriente se trabaja a partir de textos teóricos fundamentales acompañados de aplicaciones prácticas sobre obras literarias concretas. El objetivo es que los participantes adquieran un vocabulario analítico sólido y sean capaces de producir lecturas críticas argumentadas, utilizando los instrumentos conceptuales más pertinentes para cada tipo de texto y problemática literaria.',32,'2026-10-22',70.00,0.00,51.00,'ABIERTO','2026-04-16 11:26:20',NULL,NULL),(12,1,4,'pPp','P',10,'2026-05-22',10.00,10.00,51.00,'ABIERTO','2026-05-13 11:19:27','http://localhost:8080/api/uploads/actividades/915c6fb6-0a93-426c-a9cc-b9547a415318.png',NULL);
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `docente`
--

DROP TABLE IF EXISTS `docente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `docente` (
  `id_usuario` bigint NOT NULL,
  `titulo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Lic., MSc., PhD., etc.',
  PRIMARY KEY (`id_usuario`),
  CONSTRAINT `docente_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Atributos específicos del rol DOCENTE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `docente`
--

LOCK TABLES `docente` WRITE;
/*!40000 ALTER TABLE `docente` DISABLE KEYS */;
INSERT INTO `docente` VALUES (4,'Lic.'),(6,'Lic'),(7,'MSc.'),(14,'PhD');
/*!40000 ALTER TABLE `docente` ENABLE KEYS */;
UNLOCK TABLES;

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
  `estado` enum('APROBADO','REPROBADO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_evaluacion`),
  UNIQUE KEY `id_inscripcion` (`id_inscripcion`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `evaluacion_estudiante_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Nota final de un participante en un curso. Relación 1:1 con inscripcion.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evaluacion_estudiante`
--

LOCK TABLES `evaluacion_estudiante` WRITE;
/*!40000 ALTER TABLE `evaluacion_estudiante` DISABLE KEYS */;
INSERT INTO `evaluacion_estudiante` VALUES (1,2,88.00,'APROBADO','2026-03-31 12:24:26'),(2,3,77.00,'APROBADO','2026-03-31 12:24:26');
/*!40000 ALTER TABLE `evaluacion_estudiante` ENABLE KEYS */;
UNLOCK TABLES;
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
  `nombre` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `carga_horaria` int NOT NULL COMMENT 'Total de horas académicas',
  `modalidad` enum('PRESENCIAL','VIRTUAL','MIXTO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_hora` datetime NOT NULL COMMENT 'Fecha y hora del evento (un solo día)',
  `cupo_maximo` int DEFAULT NULL,
  `costo_externo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `costo_umsa` decimal(10,2) NOT NULL DEFAULT '0.00',
  `estado` enum('ABIERTO','LLENO','FINALIZADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ABIERTO',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace a evento virtual (si aplica)',
  `lugar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `imagen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Eventos facultativos. Certificación por asistencia.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `evento`
--

LOCK TABLES `evento` WRITE;
/*!40000 ALTER TABLE `evento` DISABLE KEYS */;
INSERT INTO `evento` VALUES (1,1,1,'Congreso de Historia Boliviana 2026','Congreso anual de investigadores de historia',8,'PRESENCIAL','2026-05-20 09:00:00',200,80.00,0.00,'ABIERTO','2026-03-26 02:24:45','',NULL,NULL,6),(2,2,1,'Seminario de Filosofía Contemporánea',NULL,4,'VIRTUAL','2026-04-10 15:00:00',NULL,0.00,0.00,'ABIERTO','2026-03-26 02:25:20','https://meet.google.com/xyz-abcd',NULL,NULL,NULL),(4,1,4,'Congreso Nacional de Historia de Bolivia','El Congreso Nacional de Historia de Bolivia es el encuentro académico más importante en el campo de la historia a nivel nacional, organizado en esta edición por la Carrera de Historia de la FHCE-UMSA. Reúne a historiadores, investigadores, docentes y estudiantes de todo el país para la presentación y discusión de investigaciones originales en los campos de la historia colonial, republicana, contemporánea, regional, oral y de las mentalidades. El congreso se organiza en mesas temáticas simultáneas, conferencias magistrales a cargo de ponentes internacionales invitados y un espacio de presentación de publicaciones recientes. Se otorga certificado de participación con carga horaria a todos los asistentes registrados y certificado de ponente a quienes presenten trabajos. Las ponencias seleccionadas serán publicadas en las memorias del congreso en formato digital.',20,'PRESENCIAL','2026-05-08 19:00:00',3,300.00,250.00,'LLENO','2026-04-14 14:08:47','',NULL,NULL,6),(5,1,4,' Seminario: La Guerra del Chaco, 90 Años Después','Seminario conmemorativo y académico dedicado a revisar críticamente los noventa años del fin de la Guerra del Chaco (1932–1935) y su impacto duradero en la sociedad, la política y la identidad boliviana. El evento reunió a especialistas en historia militar, historia política y estudios de memoria para debatir desde distintas perspectivas: las causas y el desarrollo de la contienda, la experiencia de los combatientes, el papel de las mujeres durante la guerra, las consecuencias territoriales y la construcción del mito chaqueño en la narrativa nacional. Se incluyeron proyecciones de documentales de época, exposición fotográfica con archivos inéditos y una mesa especial con testimonios de familiares de veteranos. El seminario fue transmitido en vivo por las redes de la FHCE.\nSeminario conmemorativo y académico dedicado a revisar críticamente los noventa años del fin de la Guerra del Chaco (1932–1935) y su impacto duradero en la sociedad, la política y la identidad boliviana. El evento reunió a especialistas en historia militar, historia política y estudios de memoria para debatir desde distintas perspectivas: las causas y el desarrollo de la contienda, la experiencia de los combatientes, el papel de las mujeres durante la guerra, las consecuencias territoriales y la construcción del mito chaqueño en la narrativa nacional. Se incluyeron proyecciones de documentales de época, exposición fotográfica con archivos inéditos y una mesa especial con testimonios de familiares de veteranos. El seminario fue transmitido en vivo por las redes de la FHCE.',12,'MIXTO','2026-07-29 11:20:00',100,80.00,0.00,'ABIERTO','2026-04-14 14:21:01','',NULL,NULL,NULL),(6,1,4,'Jornadas de Historia Regional: El Alto y La Paz en Perspectiva Histórica','Ciclo de jornadas académicas dedicadas a la historia urbana y regional de las ciudades de La Paz y El Alto, desde su fundación colonial hasta los procesos urbanos del siglo XXI. Las jornadas incluyen conferencias sobre la historia del comercio paceño, la constitución de El Alto como ciudad autónoma, las transformaciones del espacio urbano alteño, y los eventos políticos de octubre de 2003 desde una perspectiva histórica. Se propicia un diálogo entre historiadores académicos, investigadores independientes y activistas de la memoria colectiva. El evento es abierto a toda la comunidad y no requiere conocimientos previos especializados en historia, siendo adecuado tanto para estudiantes universitarios como para público general interesado en la historia local y regional de Bolivia.',30,'VIRTUAL','2026-07-07 18:20:00',200,0.00,0.00,'ABIERTO','2026-04-14 14:27:16','',NULL,NULL,NULL),(7,1,4,'Taller de Historia Oral: Metodología y Práctica','Taller intensivo y de cupo reducido orientado a estudiantes de historia, ciencias sociales y comunicación que deseen incorporar la historia oral como herramienta de investigación. Los participantes aprenden a diseñar guías de entrevista histórica, seleccionar y contactar informantes clave, conducir entrevistas en profundidad con criterios éticos y metodológicos rigurosos, y transcribir y analizar los testimonios obtenidos. Se trabaja con grabaciones de entrevistas realizadas en comunidades aymaras y mineras para el análisis crítico en grupo. El taller incorpora discusión de los principales debates teóricos de la historia oral internacional y latinoamericana, incluyendo los aportes de Alessandro Portelli, Jorge Aceves Lozano y el Taller de Historia Oral Andina (THOA) de Bolivia.',16,'MIXTO','2026-06-02 15:00:00',180,50.00,0.00,'ABIERTO','2026-04-14 14:29:51','',NULL,NULL,NULL),(8,1,4,'Foro: Descolonización y Escritura de la Historia en Bolivia','Foro abierto de debate intelectual sobre los desafíos epistemológicos y políticos de escribir historia desde perspectivas descoloniales en el contexto boliviano y latinoamericano. El foro convoca a investigadores, activistas indígenas e intelectuales comunitarios para discutir preguntas como: ¿quién tiene el derecho de narrar el pasado?, ¿qué fuentes son válidas en la historia oficial y cuáles quedan excluidas?, ¿cómo incorporar los conocimientos y las memorias de los pueblos indígenas en la escritura histórica académica? Se presentan experiencias concretas de investigación histórica comunitaria desarrolladas en el altiplano boliviano y los valles cochabambinos. El foro es de acceso completamente libre y será transmitido en vivo, con posibilidad de participar mediante preguntas en tiempo real a través del chat.\nForo abierto de debate intelectual sobre los desafíos epistemológicos y políticos de escribir historia desde perspectivas descoloniales en el contexto boliviano y latinoamericano. El foro convoca a investigadores, activistas indígenas e intelectuales comunitarios para discutir preguntas como: ¿quién tiene el derecho de narrar el pasado?, ¿qué fuentes son válidas en la historia oficial y cuáles quedan excluidas?, ¿cómo incorporar los conocimientos y las memorias de los pueblos indígenas en la escritura histórica académica? Se presentan experiencias concretas de investigación histórica comunitaria desarrolladas en el altiplano boliviano y los valles cochabambinos. El foro es de acceso completamente libre y será transmitido en vivo, con posibilidad de participar mediante preguntas en tiempo real a través del chat.',10,'PRESENCIAL','2026-07-21 18:30:00',300,0.00,0.00,'ABIERTO','2026-04-14 14:30:57','',NULL,NULL,NULL),(10,1,1,'p','uy',9,'PRESENCIAL','2026-05-13 12:10:00',9,88.00,65.99,'ABIERTO','2026-05-13 11:04:59','k','g','http://localhost:8080/api/uploads/actividades/73a9e1aa-c27d-41e6-b3b4-0f40b34acb57.png',NULL);
/*!40000 ALTER TABLE `evento` ENABLE KEYS */;
UNLOCK TABLES;

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
  `motivo` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Justificación del cambio de nota',
  `cambiado_por` bigint NOT NULL COMMENT 'Usuario que realizó el cambio (administrador)',
  `fecha_cambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_historial`),
  KEY `cambiado_por` (`cambiado_por`),
  KEY `idx_evaluacion` (`id_evaluacion`),
  CONSTRAINT `historial_ibfk_1` FOREIGN KEY (`id_evaluacion`) REFERENCES `evaluacion_estudiante` (`id_evaluacion`) ON DELETE CASCADE,
  CONSTRAINT `historial_ibfk_2` FOREIGN KEY (`cambiado_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Auditoría de cambios de nota. Cada edición genera un nuevo registro.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES (1,2,85.00,32.00,'Error de transcripción en la nota original',1,'2026-03-31 16:44:32'),(2,2,32.00,77.00,'errror',1,'2026-04-06 17:51:14'),(3,1,98.00,23.00,'bhj',1,'2026-04-09 12:26:34'),(4,1,23.00,77.00,'m',1,'2026-04-09 12:47:05'),(5,1,77.00,88.00,'jk',1,'2026-04-09 12:47:32');
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

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
  `codigo_paralelo` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Con id_curso forma FK compuesta hacia paralelo',
  `tipo_precio` enum('UMSA','EXTERNO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `saldo` decimal(10,2) NOT NULL COMMENT 'Monto que debe pagar el participante',
  `fecha_inscripcion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('PENDIENTE','CONFIRMADA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
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
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Inscripción de un participante a un curso o evento';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inscripcion`
--

LOCK TABLES `inscripcion` WRITE;
/*!40000 ALTER TABLE `inscripcion` DISABLE KEYS */;
INSERT INTO `inscripcion` VALUES (1,4,NULL,1,NULL,'EXTERNO',80.00,'2026-03-29 23:01:12','CONFIRMADA'),(2,4,1,NULL,'A','EXTERNO',250.00,'2026-03-29 23:02:08','CANCELADA'),(3,5,1,NULL,'A','EXTERNO',250.00,'2026-03-30 10:31:48','CONFIRMADA'),(4,6,NULL,1,NULL,'EXTERNO',80.00,'2026-03-31 16:37:22','CONFIRMADA'),(5,4,5,NULL,'A','EXTERNO',680.00,'2026-04-16 13:08:09','PENDIENTE'),(6,4,4,NULL,'A','EXTERNO',500.00,'2026-04-16 13:11:33','PENDIENTE'),(7,8,4,NULL,'A','EXTERNO',500.00,'2026-04-16 14:31:40','CONFIRMADA'),(8,8,NULL,4,NULL,'EXTERNO',300.00,'2026-04-16 16:32:38','CONFIRMADA'),(9,8,5,NULL,'A','EXTERNO',680.00,'2026-04-16 16:35:47','CONFIRMADA'),(10,18,9,NULL,'A','EXTERNO',400.00,'2026-04-28 13:21:08','CONFIRMADA'),(15,25,NULL,8,NULL,'EXTERNO',0.00,'2026-04-30 03:02:25','CONFIRMADA'),(16,25,NULL,4,NULL,'EXTERNO',300.00,'2026-04-30 03:04:11','CONFIRMADA'),(17,25,7,NULL,'A','EXTERNO',0.00,'2026-04-30 03:04:42','CONFIRMADA'),(18,27,NULL,4,NULL,'EXTERNO',300.00,'2026-04-30 03:33:12','CONFIRMADA'),(19,13,3,NULL,'A','EXTERNO',620.00,'2026-04-30 08:49:17','CONFIRMADA'),(20,4,NULL,7,NULL,'EXTERNO',50.00,'2026-05-05 13:57:27','CONFIRMADA'),(21,4,6,NULL,'A','EXTERNO',120.00,'2026-05-07 10:27:54','CONFIRMADA'),(22,28,3,NULL,'A','UMSA',240.00,'2026-05-12 07:18:02','CONFIRMADA'),(23,4,3,NULL,'A','EXTERNO',620.00,'2026-05-12 08:04:10','PENDIENTE'),(24,28,9,NULL,'A','UMSA',320.00,'2026-05-12 08:06:36','CONFIRMADA');
/*!40000 ALTER TABLE `inscripcion` ENABLE KEYS */;
UNLOCK TABLES;
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

    -- Verificar si la actividad es gratuita
    IF NEW.id_curso IS NOT NULL THEN
        SELECT COUNT(*) INTO es_gratis
        FROM curso
        WHERE id_curso = NEW.id_curso AND costo_externo = 0 AND costo_umsa = 0;
    ELSE
        SELECT COUNT(*) INTO es_gratis
        FROM evento
        WHERE id_evento = NEW.id_evento AND costo_externo = 0 AND costo_umsa = 0;
    END IF;

    -- Solo validar si la actividad tiene costo
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

        -- Cupo del paralelo específico
        SELECT cupo_maximo INTO cupo_par
        FROM paralelo
        WHERE id_curso = NEW.id_curso AND codigo = NEW.codigo_paralelo;

        IF cupo_par IS NOT NULL THEN

            -- Inscritos confirmados en ese paralelo
            SELECT COUNT(*) INTO total_inscritos
            FROM inscripcion
            WHERE id_curso = NEW.id_curso
              AND codigo_paralelo = NEW.codigo_paralelo
              AND estado = 'CONFIRMADA';

            IF total_inscritos >= cupo_par THEN

                -- Paralelos con cupo definido en el curso
                SELECT COUNT(*) INTO paralelos_con_cupo
                FROM paralelo
                WHERE id_curso = NEW.id_curso AND cupo_maximo IS NOT NULL;

                -- Paralelos que ya alcanzaron su cupo
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

                -- Solo marcar LLENO si todos los paralelos están llenos
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
  `metodo_pago` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Método usado en pasarela Libélula',
  `referencia_transaccion` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID de transacción devuelto por Libélula',
  `estado` enum('PENDIENTE','APROBADO','RECHAZADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `fecha_pago` datetime DEFAULT NULL COMMENT 'Momento de confirmación del pago',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_pago`),
  KEY `idx_inscripcion` (`id_inscripcion`),
  KEY `idx_estado` (`estado`),
  KEY `idx_referencia` (`referencia_transaccion`),
  CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`id_inscripcion`) REFERENCES `inscripcion` (`id_inscripcion`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Transacción de pago asociada a una inscripción';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago`
--

LOCK TABLES `pago` WRITE;
/*!40000 ALTER TABLE `pago` DISABLE KEYS */;
INSERT INTO `pago` VALUES (1,1,80.00,'MOCK_QR','MOCK-526E5FFC','APROBADO','2026-03-29 23:03:41','2026-03-29 23:03:41'),(2,3,250.00,'MOCK_QR','MOCK-AA6D2103','APROBADO','2026-03-30 10:32:20','2026-03-30 10:32:20'),(3,2,250.00,'MOCK_QR','MOCK-4BE2520A','APROBADO','2026-03-31 11:27:40','2026-03-31 11:27:40'),(4,4,80.00,'MOCK_QR','MOCK-294BAB17','APROBADO','2026-03-31 16:38:33','2026-03-31 16:38:33'),(5,7,500.00,'MOCK_QR','MOCK-F1FD2779','APROBADO','2026-04-16 14:32:49','2026-04-16 14:32:49'),(6,8,300.00,'MOCK_QR','MOCK-30B6D43A','APROBADO','2026-04-16 16:32:46','2026-04-16 16:32:46'),(7,9,680.00,'MOCK_QR','MOCK-EA35FC41','APROBADO','2026-04-16 16:35:49','2026-04-16 16:35:49'),(8,10,400.00,'MOCK_QR','MOCK-3013782F','APROBADO','2026-04-28 13:21:18','2026-04-28 13:21:18'),(9,16,300.00,'MOCK_QR','MOCK-25BF211F','APROBADO','2026-04-30 03:04:15','2026-04-30 03:04:15'),(10,18,300.00,'MOCK_QR','MOCK-D6CBDCA3','APROBADO','2026-04-30 03:33:15','2026-04-30 03:33:15'),(11,19,620.00,'MOCK_QR','MOCK-4525E39E','APROBADO','2026-04-30 08:49:20','2026-04-30 08:49:20'),(12,20,50.00,'MOCK_QR','MOCK-6EA21911','APROBADO','2026-05-05 13:57:31','2026-05-05 13:57:31'),(13,21,120.00,'MOCK_QR','MOCK-41030AAE','APROBADO','2026-05-07 10:28:08','2026-05-07 10:28:08'),(14,22,240.00,'MOCK_QR','MOCK-53919FCF','APROBADO','2026-05-12 07:25:42','2026-05-12 07:25:42'),(15,24,320.00,'MOCK_QR','MOCK-88BDA3B3','APROBADO','2026-05-12 08:06:38','2026-05-12 08:06:38');
/*!40000 ALTER TABLE `pago` ENABLE KEYS */;
UNLOCK TABLES;
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
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clave parcial: A, B, 01, etc.',
  `id_docente` bigint DEFAULT NULL COMMENT 'FK al usuario con rol DOCENTE',
  `modalidad` enum('PRESENCIAL','VIRTUAL','MIXTO') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cupo_maximo` int DEFAULT NULL,
  `horario_descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lugar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Enlace a clase virtual (si aplica)',
  PRIMARY KEY (`id_curso`,`codigo`),
  KEY `idx_docente` (`id_docente`),
  CONSTRAINT `paralelo_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `paralelo_ibfk_2` FOREIGN KEY (`id_docente`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entidad débil de CURSO — clave compuesta (id_curso, codigo)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paralelo`
--

LOCK TABLES `paralelo` WRITE;
/*!40000 ALTER TABLE `paralelo` DISABLE KEYS */;
INSERT INTO `paralelo` VALUES (1,'A',6,'PRESENCIAL',30,'Lunes y miércoles 08:00 - 10:00',NULL,'https://meet.google.com/abc-123'),(1,'B',4,'VIRTUAL',50,'',NULL,'https://meet.google.com/abc-defg-hij'),(3,'A',14,'PRESENCIAL',50,'Miercoles 12:00 - 14:00',NULL,''),(4,'A',14,'PRESENCIAL',30,'Jueves 18:00-20:00',NULL,''),(5,'A',6,'PRESENCIAL',20,'Lunes a Viernes, 20:00-21:00',NULL,''),(6,'A',14,'PRESENCIAL',30,'Lunes 14:00-16:00',NULL,''),(7,'A',14,'PRESENCIAL',20,'Miercoles 15:00-17:00',NULL,''),(8,'A',4,'PRESENCIAL',40,'lu',NULL,''),(9,'A',6,'MIXTO',50,'Lunes y Martes, 18:00 - 20:00',NULL,''),(10,'A',6,'PRESENCIAL',10,'Martes y Jueves, 10:00 - 12:00',NULL,''),(11,'A',14,'PRESENCIAL',30,'Viernes 14:00 - 16:00',NULL,''),(12,'A',6,'VIRTUAL',10,'USUU','HSHS',''),(12,'B',6,'MIXTO',100,'bbbbb','bbbbbbb','bbbbbb');
/*!40000 ALTER TABLE `paralelo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `participante`
--

DROP TABLE IF EXISTS `participante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `participante` (
  `id_usuario` bigint NOT NULL,
  `tipo_participante` enum('UMSA','EXTERNO') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Determina el precio aplicado en inscripción',
  PRIMARY KEY (`id_usuario`),
  KEY `idx_tipo` (`tipo_participante`),
  CONSTRAINT `participante_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Atributos específicos del rol PARTICIPANTE';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `participante`
--

LOCK TABLES `participante` WRITE;
/*!40000 ALTER TABLE `participante` DISABLE KEYS */;
INSERT INTO `participante` VALUES (28,'UMSA'),(4,'EXTERNO'),(5,'EXTERNO'),(6,'EXTERNO'),(7,'EXTERNO'),(8,'EXTERNO'),(11,'EXTERNO'),(13,'EXTERNO'),(14,'EXTERNO'),(15,'EXTERNO'),(16,'EXTERNO'),(18,'EXTERNO'),(24,'EXTERNO'),(25,'EXTERNO'),(26,'EXTERNO'),(27,'EXTERNO'),(29,'EXTERNO'),(30,'EXTERNO');
/*!40000 ALTER TABLE `participante` ENABLE KEYS */;
UNLOCK TABLES;

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
  `archivo_pdf` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Ruta del archivo PDF subido',
  `version` int NOT NULL DEFAULT '1',
  `subida_por` bigint NOT NULL COMMENT 'FK al usuario con rol DISEÑADOR',
  `fecha_subida` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` enum('PENDIENTE','VIGENTE','HISTORICA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  PRIMARY KEY (`id_plantilla`),
  KEY `subida_por` (`subida_por`),
  KEY `idx_curso` (`id_curso`),
  KEY `idx_evento` (`id_evento`),
  KEY `idx_estado` (`estado`),
  CONSTRAINT `plantilla_certificado_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `plantilla_certificado_ibfk_2` FOREIGN KEY (`id_evento`) REFERENCES `evento` (`id_evento`) ON DELETE CASCADE,
  CONSTRAINT `plantilla_certificado_ibfk_3` FOREIGN KEY (`subida_por`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Plantilla PDF para certificados. Solo una VIGENTE por actividad.';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plantilla_certificado`
--

LOCK TABLES `plantilla_certificado` WRITE;
/*!40000 ALTER TABLE `plantilla_certificado` DISABLE KEYS */;
INSERT INTO `plantilla_certificado` VALUES (1,1,NULL,'C:\\Users\\kbre1\\Documents\\INFORMATICA\\sistema-cursos-fhce\\plantillas\\plantilla_curso_1_v1_0d813633.pdf',1,6,'2026-04-06 15:03:36','VIGENTE'),(2,NULL,4,'C:\\Users\\kbre1\\Documents\\INFORMATICA\\sistema-cursos-fhce\\backend\\sistema-cursos\\plantillas\\plantilla_evento_4_v1_84ca5371.pdf',1,6,'2026-05-08 21:08:03','HISTORICA'),(3,NULL,4,'C:\\Users\\kbre1\\Documents\\INFORMATICA\\sistema-cursos-fhce\\backend\\sistema-cursos\\plantillas\\plantilla_evento_4_v2_4c1f6299.pdf',2,6,'2026-05-09 18:43:51','HISTORICA'),(4,NULL,4,'C:\\Users\\kbre1\\Documents\\INFORMATICA\\sistema-cursos-fhce\\backend\\sistema-cursos\\plantillas\\plantilla_evento_4_v3_af20c231.pdf',3,6,'2026-05-09 19:34:56','VIGENTE');
/*!40000 ALTER TABLE `plantilla_certificado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_token`
--

DROP TABLE IF EXISTS `refresh_token`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_token` (
  `id_refresh` bigint NOT NULL AUTO_INCREMENT,
  `id_usuario` bigint NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revocado` tinyint(1) NOT NULL DEFAULT '0',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_expiracion` datetime NOT NULL,
  PRIMARY KEY (`id_refresh`),
  UNIQUE KEY `token` (`token`),
  KEY `idx_usuario` (`id_usuario`),
  KEY `idx_revocado` (`revocado`),
  CONSTRAINT `refresh_token_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_token`
--

LOCK TABLES `refresh_token` WRITE;
/*!40000 ALTER TABLE `refresh_token` DISABLE KEYS */;
INSERT INTO `refresh_token` VALUES (1,4,'5oWFwdyQlaCSMsNetnUD8poU0KPL4AmlgVS6byZ5DIF8vRxlaQsPQz40YMbAk0tNOcDybJ3drKqsb6W14uWTPA',1,'2026-05-11 13:17:27','2026-05-18 13:17:27'),(2,4,'9GHXwphDPc6B9kMYeFxBWoMdWv9by5H-N6d__yIhvwGE5SylA1GGG5gaIYrbXeAZF3NbIkqxIcFYd2Z7gwa3Qg',1,'2026-05-11 13:21:00','2026-05-18 13:21:00'),(3,4,'MKllJojikQ1mHRhMRcSxCqx8qEdXVZgfCbHW5hN2OEaoAPw5JKc0M531azMQbszN-oDoZ26jFqpvj3SimSV0uQ',1,'2026-05-11 13:32:59','2026-05-18 13:32:59'),(4,4,'jH5RQX__X56SZRQ4sKKbHOHHKW8zK-B1jxMiHA_FlG1iSQAxVc5uGJsqM8LVYvJxLfM_uu8JULA8JVBL6XcD9g',1,'2026-05-11 14:59:28','2026-05-18 14:59:28'),(5,4,'kEsCpdfq4IhjX8vqyD7E39zFzpPQVbtpNiGV22Z5MfuILiAny7FsjU5T6_E1maTiHGjOSZPyv9nLiwL1Il5pmQ',0,'2026-05-11 15:07:46','2026-05-18 15:07:46'),(6,4,'N4POJpANa5ZjoO3juJxyd9TWGsB1eFE1OmHxot07UrQ9Qe0FLkuYRE8D63qr8TywFPfD0YV7f7Ugfjs4SWQovA',0,'2026-05-11 15:08:19','2026-05-18 15:08:19'),(7,4,'dSs0SmsQ6BMgitqh_edG6K86hWS-o2-JKCTKDJ0FI0dhn3uppWnUywnd6bs4o_HSZVnsDFI-EyTMC60blyW9_w',0,'2026-05-11 15:08:53','2026-05-18 15:08:53'),(8,4,'bGSz0oytZLRIKcKNGXMsfgVughM1QWFgiPBu6Ix_ZBBjy-Ltd3xDmkR8TS23QHaTWKSIRpqBZgEeSPfFsRgqoQ',1,'2026-05-11 15:10:07','2026-05-18 15:10:07'),(9,4,'kdhzPRQFdd7gS1IEFUqCeG_nZ8xCrNqjLmX-ZGB5bgFos1R1-K3gEsJK9AhqeCLDDNp_6cv79g3PwTWaWXXPRg',0,'2026-05-11 15:18:36','2026-05-18 15:18:36'),(10,4,'PCLuvDNWb5RLYLekfXWhhm9qfS0VHLqXYN8CuOrp7dC0E5oRrBztgjL0jAozhiCCnz1MmF2_hC8iyznGPnU7Fg',0,'2026-05-11 15:18:36','2026-05-18 15:18:36'),(11,4,'dLaFE6n5fIoOebEmqUZ2xb25ZzKt6rTLE02GpnrqTe-FMK63eEYmBdTTqevt6fYYdgnhnf_25obWtcvp0fkJpQ',0,'2026-05-11 15:18:36','2026-05-18 15:18:36'),(12,4,'Z1M4qIYme6b7AGGuL9UO20XcE7YWEFBmnFd55nA2Z7mEVutBY6i1v_RG6RvJ0qIN2WAnlR2aiNhOyNWSeOxkUg',0,'2026-05-11 15:18:42','2026-05-18 15:18:42'),(13,4,'KUKimcGcYAHMIg4J9bzy-8wrjZFt3ht6PBL3fArjZlTt-g3RiyOKMT_rZ2074XCKP_v4cX6zt2-V3abeBeCCDw',1,'2026-05-11 15:19:16','2026-05-18 15:19:16'),(14,4,'ptiAqQmoJimFEctasAQABtE2-xsjddxJ4pEBlEpBEPyhh92mlTWZ0vm-0l2fCuVyL0-v91zUUdH0LP_d5vxj-g',0,'2026-05-11 15:19:28','2026-05-18 15:19:28'),(15,4,'yRdwpO1LW6hxss0R7K6jXZNRawBk1DCR1rFxP85GZHZ_PLk2D4lPnMxdC_orueVfJbeWepiyZ2ZaJH0nReXAng',0,'2026-05-11 15:19:28','2026-05-18 15:19:28'),(16,4,'6pUEokN4KBpLqPnVGOnvBzVj0WK1Dh8PfbJKGeLh4IT0LpAq6hRyvS_Wv5gteR_TXnZrVME9sDVJAOr28cxR1Q',0,'2026-05-11 15:19:28','2026-05-18 15:19:28'),(17,1,'ALEA6EJiX-PBeAXbYa-sBAuDKb2CR3bmBshqrjGAgBfCN882TqbdKRtJxZE2cNiuQg76rE154Pb1y-ZZ7ZOXqw',1,'2026-05-12 06:22:29','2026-05-19 06:22:29'),(18,1,'2bEcSM90A_bgAIATonaLXwNIQQnjsA92H1M5lygVpTapgnj5XJrXgbt2ZutYFmQl6VCadEBjkMop7jfPvImN_A',1,'2026-05-12 06:24:06','2026-05-19 06:24:06'),(19,28,'v1KzapVXEoimDBrdZSGOLkhuxLTShE_jxQgH0XhE2u_SiSTbrLJPf9J6xT5D80PABbmbgNR8_HeJRt6wCnYEfg',1,'2026-05-12 06:40:09','2026-05-19 06:40:09'),(20,4,'qbMtv3QF7wOyTaThpAR7ZJ0G_REVMl2SdCmOF7Gz-umphycJywQgrg_2tVBUaLrRPJsv7-upJd-cJyUssefWsw',1,'2026-05-12 06:40:55','2026-05-19 06:40:55'),(21,1,'6J2D1RbuDpRn1dffC9bASxvnMh4_jq93n8i82-CLylont2Qwryb9b5MGB3mw2pKm7bM0MKfw2jMYCJ4DiMGn1Q',1,'2026-05-12 06:55:02','2026-05-19 06:55:02'),(22,28,'EYpeNTN52ztcAN9F9osElVOJoIAQzd3Fbkrmj3O87wjlwk7bl2SIhz8yD_XnbYXjXZ4jroX9yihpybrDGoE4uw',1,'2026-05-12 07:08:48','2026-05-19 07:08:48'),(23,4,'OSzjyfAOoPmo10O3GbHNa6piaBKLUWzsN_yIEG_bYwrueuQ0JIGlk-ystkHKRF7t5w5xb6JybIDoRMq1K0P3wg',1,'2026-05-12 07:28:43','2026-05-19 07:28:43'),(24,1,'tDGeNq3InsASVagb0Gsv4c_oFBenc29cWfY_sdCYJi3vP1rtu4dJwmr_6vr2QKU-GORIl3PjVXD1srciM6PAHA',1,'2026-05-12 07:55:30','2026-05-19 07:55:30'),(25,4,'93eWTK_DRZ77j8AnOlh-ZYrdbugrvT8CGJVw-h5-ywSR2TGwUOmaPO1jeFi2ngYBZtQccDGEQak3-dT4wNkQuQ',1,'2026-05-12 07:57:10','2026-05-19 07:57:10'),(26,28,'TvLv-JdbAG93LE1QqgSilKb51Y0cQYO8IcYOPw6D8ZfHlyz84gnYqDTiUF4zQKZkEPXwx-oYQNoS8WWIqu9zBQ',1,'2026-05-12 08:06:13','2026-05-19 08:06:13'),(27,4,'5qez0GeNO4MCohlkPp8Y5WwZN9T6Vou3ySbFxG2hglPFpAmffQuZ_Sa08w3UmoVnLy0zf4p9sqWi21v3Ih7mRg',1,'2026-05-12 08:06:50','2026-05-19 08:06:50'),(28,1,'1tW07Fde3B_LEQt1u0xdddTJHUI8MhFh41Gr-qgPTwwbu2OC6BRqrtNfWfM-RoPq6SnUSq-o5nECf0s0QYFAWQ',1,'2026-05-12 08:07:20','2026-05-19 08:07:20'),(29,4,'aGU_VEDlB2Ew8anYABXFbl46AKK_jqU38blwPHxGNbC32PYT_eZtprDwaO3roVLG5ayHiutcY2ix2wN6gmIGDA',1,'2026-05-12 08:09:46','2026-05-19 08:09:46'),(30,1,'dE-f3gU3ONQBouo5ETzuwNnrLvvr6K7qhfeibYL-M_oyIqS0eANlx3v6HMUdyuHy-nYn9gYmX3isjFX6zUnM3w',1,'2026-05-12 11:42:15','2026-05-19 11:42:15'),(31,4,'iTVV2CmBcO8Pak4uakKZYDFN-9nnnQ2348uVA6bXENrKZ_5UiA4NXoidj6_wxA2Tg_mSArPdUjtQoXjoRZB06g',1,'2026-05-12 11:53:10','2026-05-19 11:53:10'),(32,30,'hGTTPJ-3TxO-QNHreUOT7JQ56daa145_x3YwW3jv3rRMQGiCoeKO_JFoiOtSiJ35y_6fd9fOizqzD46CKR9dfg',1,'2026-05-12 11:56:44','2026-05-19 11:56:44'),(33,4,'T_VLzOlIT1dsTk7L-d_bGf0WFRBg1wkeDD3YD_FFP84RkJwjwyomOWwFjWM93YJSWZi5zxx2ZvsYq78THXQ55g',1,'2026-05-13 09:22:54','2026-05-20 09:22:54'),(34,6,'I4zCli1jd1lYr818bbAObPh2WoLt2YN0tE1ekkyENodQXGM_bZBEXu2TqPIHfBhmimcOBAR0vhiUTKdjE_zpag',1,'2026-05-13 09:23:05','2026-05-20 09:23:05'),(35,25,'7Z6FbHn8Bm0CPRjleyKpjS67gCj6ZZc5Pi8qz77JsJuLIecwcd1AG5luGok447CqQd82Rz4zBYebQRRM3GqDfw',1,'2026-05-13 09:34:07','2026-05-20 09:34:07'),(36,1,'3BkGHJnJAtlQZADThfbsr_QuQ0mYdCSWELsqG8_esK9aFOrrv7--YHG9IBS04nVlykYAGuID-gXa6EowzN_Czg',0,'2026-05-13 09:39:28','2026-05-20 09:39:28'),(37,4,'N78nFAwPUyZI0KCRwCemDqyFo3U3l2w-3hQqX-MXsVRxVD6z5ROwoK0uNsxkCdYhESrC-kz3cKMZawcXExDjPw',1,'2026-05-13 11:09:27','2026-05-20 11:09:27'),(38,4,'wSlfObezZNpFLAAFJ0w2thu7ijXd2KlNsiP3wL6dJdWmbuJcHtU4nft46cEj76Zt6pwEVNIbTZDcZ1JeCH9UoQ',0,'2026-05-13 11:48:38','2026-05-20 11:48:38');
/*!40000 ALTER TABLE `refresh_token` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `id_rol` bigint NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ADMINISTRADOR|COORDINADOR|DOCENTE|PARTICIPANTE|AUXILIAR|DISEÑADOR',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catálogo de roles del sistema';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'ADMINISTRADOR','Acceso completo al sistema'),(2,'COORDINADOR','Gestión de cursos y eventos de su carrera'),(3,'DOCENTE','Registro de calificaciones y confirmación para emisión de certificados'),(4,'PARTICIPANTE','Inscripción a cursos y eventos, descarga de certificados'),(5,'AUXILIAR','Registro de asistencia en eventos asignados'),(6,'DISEÑADOR','Gestión de plantillas de certificados');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_emision`
--

DROP TABLE IF EXISTS `solicitud_emision`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_emision` (
  `id_solicitud` bigint NOT NULL AUTO_INCREMENT,
  `id_curso` bigint DEFAULT NULL COMMENT 'NULL si es evento',
  `codigo_paralelo` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Con id_curso forma FK compuesta hacia paralelo',
  `id_evento` bigint DEFAULT NULL COMMENT 'NULL si es curso',
  `id_docente` bigint NOT NULL COMMENT 'Docente que confirmó las calificaciones',
  `cantidad_aprobados` int NOT NULL,
  `estado` enum('PENDIENTE','EN_PROCESO','COMPLETADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `procesado_por` bigint DEFAULT NULL COMMENT 'Coordinador que procesó la solicitud',
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_procesamiento` datetime DEFAULT NULL,
  `notas` text COLLATE utf8mb4_unicode_ci COMMENT 'Observaciones adicionales del docente',
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Generada cuando el docente confirma notas. Flujo: PENDIENTE→EN_PROCESO→COMPLETADO';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_emision`
--

LOCK TABLES `solicitud_emision` WRITE;
/*!40000 ALTER TABLE `solicitud_emision` DISABLE KEYS */;
INSERT INTO `solicitud_emision` VALUES (1,1,'A',NULL,4,2,'EN_PROCESO',4,'2026-03-31 15:27:23','2026-03-31 15:28:15','Todos los estudiantes completaron el curso satisfactoriamente'),(2,NULL,NULL,4,4,2,'COMPLETADO',4,'2026-05-09 22:29:44','2026-05-09 22:29:44','Generada desde el panel de emisión');
/*!40000 ALTER TABLE `solicitud_emision` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'RU para UMSA; username para externos',
  `nombres` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `apellidos` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verificado` tinyint(1) NOT NULL DEFAULT '0',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Solo externos; NULL para usuarios UMSA',
  `estado` enum('ACTIVO','INACTIVO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVO',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_estado` (`estado`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Entidad base de la jerarquía de usuarios';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin','Administrador','Sistema','admin@fhce.umsa.bo',1,'$2a$12$7xiHGad3crt.a49Sowmq6OVANGvytvbs3P33mlmtwXYsKU4AXFkAi','ACTIVO','2026-03-23 02:27:26'),(4,'jperez','Juan','Pérez','juan@example.com',1,'$2a$12$1NObUo9oWi6n8OPCZBXPPum7NCGmnyBjmwYRMQ9sUiBBqBzgNAj.a','ACTIVO','2026-03-23 01:04:55'),(5,'kass','Kasandra Belen','Ramos Espejo','kbre1887@gmail.com',1,'$2a$12$X4yKsVRO1izNBEMf9Nl/kuVlI6riPUyViLBy353ugS.bZjp4iy27O','ACTIVO','2026-03-24 12:09:53'),(6,'julian','julian','quinteros','jquinti@gmail.com',1,'$2a$12$SJPEQMVf5czvEpvyc.3IOug5a4nwGoJXAtPjBY.LyhZREE6WKXn7u','ACTIVO','2026-03-31 16:19:27'),(7,'demo.participante','Demo','Participante','demo.participante@example.com',0,'$2a$12$LtmR8p8fT0STM2qWAl8sweIPuPxxakNDBXxeB19EVgAQh7GcD1Yxu','ACTIVO','2026-04-06 16:31:52'),(8,'anette','Anette Yomara','Fabrica Merlo','anettefm@gmail.com',0,'$2a$12$Up6nDv0mCl4QgK7YLJPE2OX2azyhAzbJyOwwzO30fNaDuXS1Z8j7u','ACTIVO','2026-04-13 15:27:02'),(11,'lenz','Lenz Abad','Alanoca Ojeda','lenzabad@gmail.com',0,'$2a$12$AfHp3RA5eHio8ct1VrsJjuPbHn4BX8P1zar.SzJ0HPaloqGsewtZ.','ACTIVO','2026-04-13 15:44:20'),(13,'juan','Juan Abraham','Ramos Frias','juanramosxd11@gmail.com',1,'$2a$12$/elbv7N9IAlYajJmAqOwkuDleCMCastKhrDyfqMutfzo23iHsTv2K','ACTIVO','2026-04-14 09:37:30'),(14,'alejando','Alejandro Ariel','Alarcon Aduviri','ramos.12424471@gmail.com',0,'$2a$12$WdQomCdPQ6/aLeud9/XQuOXZERGouGm5gr3mUEm6IBH8GZZPNvm3O','ACTIVO','2026-04-14 09:46:56'),(15,'benjo','Benjamin Bruno','Benavides Belgarejo','kramose@fcpn.edu.bo',1,'$2a$12$4k0lTHIjVsdpvKQ2fgkGg.fHUN/EBio0J8fcqhhoOR2ezN/FJwkFK','ACTIVO','2026-04-14 10:41:03'),(16,'miranda','Miranda Maria Belen','Valencia Lima','josejulianquinteros@gmail.com',1,'$2a$12$mMD/YWZi1JkrLFNbyrdoUOtr8ZvAmPj1wCQqCRWWCIpMd/VC17zOS','ACTIVO','2026-04-14 15:18:05'),(18,'MishCalle','Mishel Alejandra','Calle Nina','mishelcalle16@gmail.com',1,'$2a$12$BDKvpMb3OK3rBzP9hGCO/u9ahXzO/OZzsFQPyH6mBf7OmWT13Deey','ACTIVO','2026-04-28 13:08:34'),(24,'daph','daph damaris','duran diaz','mishelcalle735n@gmail.com',1,'$2a$12$MEy5Q70yt5UJP63tj6vGp.0k5.ee3.fS8e7dzzEcEwofHWXWcUv/u','ACTIVO','2026-04-28 17:21:17'),(25,'cris','cristian cesar','conde cordoba','n910darok@gmail.com',1,'$2a$12$W7GR7jC9CHGwqBQlOcyKkOWnQbMH5PguGF7hmY.KmqEXtNH5v3b5C','ACTIVO','2026-04-30 02:38:17'),(26,'evians','evians edith','escobar escobar2','kramose@gmail.com',0,'$2a$12$BtPbhcO08bCSKchfef8LwevF6WcuusvnrqGaPJ.yWnVHl93hB7srK','ACTIVO','2026-04-30 03:27:07'),(27,'evianss','evians edith','escobar escobar2','n910loquis@gmail.com',1,'$2a$12$C8DT08e5Ua7t9mr3kqMq3On2QmdrFBtE5cnrX8fEh9ZBWL8VVa1rW','ACTIVO','2026-04-30 03:31:32'),(28,'20190001','Mariana','Lopez','20190001@umsa.bo',1,NULL,'ACTIVO','2026-05-12 06:40:08'),(29,'elbawan','elba','wool','elbawan@gmail.com',0,'$2a$12$3xRdEXWnKhzoOcjaA0Z8TuovDAVPAMDz8dxuFotGSG1RFvASvoORK','ACTIVO','2026-05-12 07:54:22'),(30,'elbawann','Elba Ruth','Espejo Alvarado','kasandraramos.aplis@gmail.com',1,'$2a$12$wMhzrVJm6moxMDDkTftE9ORabyEcko.OIWO7v9L73ZdfB5Cr.cAY6','ACTIVO','2026-05-12 11:55:41');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `usuario_rol`
--

LOCK TABLES `usuario_rol` WRITE;
/*!40000 ALTER TABLE `usuario_rol` DISABLE KEYS */;
INSERT INTO `usuario_rol` VALUES (1,1,'2026-03-23 02:27:30',NULL),(4,2,'2026-03-24 20:21:43',NULL),(4,3,'2026-03-24 20:33:57',NULL),(4,4,'2026-03-23 05:04:58',NULL),(4,5,'2026-03-31 20:03:50',NULL),(5,4,'2026-03-24 16:09:55',NULL),(5,6,'2026-05-07 19:57:39',4),(6,3,'2026-04-06 21:24:40',1),(6,4,'2026-03-31 20:19:29',NULL),(6,5,'2026-03-31 20:21:23',NULL),(6,6,'2026-04-06 18:35:29',NULL),(7,3,'2026-04-09 20:40:58',4),(7,4,'2026-04-06 20:31:54',NULL),(8,4,'2026-04-13 19:27:51',NULL),(8,5,'2026-04-30 07:47:15',4),(11,4,'2026-04-13 19:45:02',NULL),(11,5,'2026-04-30 07:51:33',4),(13,4,'2026-04-14 13:37:38',NULL),(13,5,'2026-04-30 12:46:59',4),(14,3,'2026-04-16 15:28:18',4),(14,4,'2026-04-14 13:47:02',NULL),(15,4,'2026-04-14 14:41:17',NULL),(16,4,'2026-04-14 19:18:10',NULL),(18,2,'2026-04-28 19:33:50',1),(18,4,'2026-04-28 17:08:40',NULL),(18,5,'2026-04-28 19:35:25',4),(24,4,'2026-04-28 21:21:19',NULL),(24,5,'2026-05-07 12:37:18',4),(25,4,'2026-04-30 06:38:22',NULL),(25,5,'2026-04-30 07:52:24',4),(26,4,'2026-04-30 07:27:12',NULL),(27,4,'2026-04-30 07:31:37',NULL),(28,4,'2026-05-12 10:40:08',NULL),(29,4,'2026-05-12 11:54:28',NULL),(30,4,'2026-05-12 15:55:47',NULL);
/*!40000 ALTER TABLE `usuario_rol` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-13 16:58:51
