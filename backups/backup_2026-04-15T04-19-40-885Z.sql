-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: bank_db
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
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `account_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int DEFAULT NULL,
  `account_type` varchar(20) DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`account_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `account_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,1,'Saving',30000.00);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_account_insert` AFTER INSERT ON `account` FOR EACH ROW BEGIN
    INSERT INTO audit_log (table_name, action, new_value, performed_by)
    VALUES ('account', 'INSERT', CONCAT('AccID: ', NEW.account_id, ', Bal: ', NEW.balance), COALESCE(@app_user, USER()));
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
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_account_update` AFTER UPDATE ON `account` FOR EACH ROW BEGIN
    INSERT INTO audit_log (table_name, action, old_value, new_value, performed_by)
    VALUES ('account', 'UPDATE', CONCAT('Bal: ', OLD.balance), CONCAT('Bal: ', NEW.balance), COALESCE(@app_user, USER()));
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
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_account_delete` AFTER DELETE ON `account` FOR EACH ROW BEGIN
    INSERT INTO audit_log (table_name, action, old_value, performed_by)
    VALUES ('account', 'DELETE', CONCAT('AccID: ', OLD.account_id, ', Bal: ', OLD.balance), COALESCE(@app_user, USER()));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `audit_log`
--

DROP TABLE IF EXISTS `audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_log` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `table_name` varchar(50) DEFAULT NULL,
  `action` varchar(50) DEFAULT NULL,
  `old_value` text,
  `new_value` text,
  `performed_by` varchar(50) DEFAULT 'System_User',
  `performed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_log`
--

LOCK TABLES `audit_log` WRITE;
/*!40000 ALTER TABLE `audit_log` DISABLE KEYS */;
INSERT INTO `audit_log` VALUES (1,'account','INSERT',NULL,'AccID: 1, Bal: 20000.00','root@localhost','2026-04-14 17:50:12'),(2,'account','UPDATE','Bal: 20000.00','Bal: 10000.00','root@localhost','2026-04-14 17:50:36'),(3,'transactions','INSERT',NULL,'TxnID: 1, Acc: 1, Amt: 10000.00, Type: withdraw','root@localhost','2026-04-14 17:50:36'),(4,'account','UPDATE','Bal: 10000.00','Bal: 30000.00','root@localhost','2026-04-14 17:50:48'),(5,'transactions','INSERT',NULL,'TxnID: 2, Acc: 1, Amt: 20000.00, Type: deposit','root@localhost','2026-04-14 17:50:48');
/*!40000 ALTER TABLE `audit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customer` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `email` varchar(50) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `address` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES (1,'Test Customer','cust1@example.com','1234567890','123 Test St');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `query_logs`
--

DROP TABLE IF EXISTS `query_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `query_logs` (
  `log_id` int NOT NULL AUTO_INCREMENT,
  `query_text` text,
  `execution_time_ms` int DEFAULT NULL,
  `route_called` varchar(100) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB AUTO_INCREMENT=375 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `query_logs`
--

LOCK TABLES `query_logs` WRITE;
/*!40000 ALTER TABLE `query_logs` DISABLE KEYS */;
INSERT INTO `query_logs` VALUES (1,'SELECT * FROM users WHERE username=?',5,'/login','2026-04-14 16:57:35'),(2,'SELECT COUNT(*) AS totalCustomers FROM customer',5,'/dashboard-stats','2026-04-14 16:57:35'),(3,'SELECT * FROM customer ORDER BY customer_id DESC',5,'/customers','2026-04-14 16:57:35'),(4,'SELECT COUNT(*) AS activeAccounts FROM account',8,'/dashboard-stats','2026-04-14 16:57:35'),(5,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',2,'/dashboard-stats','2026-04-14 16:57:35'),(6,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',3,'/api/all-accounts','2026-04-14 16:57:39'),(7,'SELECT * FROM customer',2,'/api/customers','2026-04-14 16:57:39'),(8,'SELECT * FROM audit_log ORDER BY performed_at DESC',3,'/audit-log','2026-04-14 16:57:40'),(9,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 16:57:41'),(10,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',3,'/slow-queries','2026-04-14 16:57:41'),(11,'SELECT * FROM users',2,'/api/users','2026-04-14 16:57:46'),(12,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 16:57:51'),(13,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 16:57:51'),(14,'SELECT COUNT(*) AS activeAccounts FROM account',2,'/dashboard-stats','2026-04-14 16:57:51'),(15,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',5,'/dashboard-stats','2026-04-14 16:57:51'),(16,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 16:58:51'),(17,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 16:58:51'),(18,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 16:58:51'),(19,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 16:58:51'),(20,'SELECT * FROM customer',1,'/api/customers','2026-04-14 16:59:38'),(21,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 16:59:38'),(22,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 16:59:41'),(23,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 16:59:45'),(24,'SELECT COUNT(*) AS totalCustomers FROM customer',4,'/dashboard-stats','2026-04-14 16:59:45'),(25,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 16:59:45'),(26,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 16:59:45'),(27,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:01:08'),(28,'SELECT COUNT(*) AS totalCustomers FROM customer',1,'/dashboard-stats','2026-04-14 17:01:08'),(29,'SELECT COUNT(*) AS activeAccounts FROM account',2,'/dashboard-stats','2026-04-14 17:01:08'),(30,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:01:08'),(31,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:01:10'),(32,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 17:01:21'),(33,'SELECT COUNT(*) AS totalCustomers FROM customer',2,'/dashboard-stats','2026-04-14 17:01:21'),(34,'SELECT COUNT(*) AS activeAccounts FROM account',2,'/dashboard-stats','2026-04-14 17:01:21'),(35,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:01:21'),(36,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:01:53'),(37,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:01:53'),(38,'SELECT COUNT(*) AS activeAccounts FROM account',2,'/dashboard-stats','2026-04-14 17:01:53'),(39,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:01:53'),(40,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:01:55'),(41,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',0,'/slow-queries','2026-04-14 17:01:58'),(42,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:01:58'),(43,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 17:03:03'),(44,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:03:03'),(45,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:03:11'),(46,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:03:11'),(47,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:03:11'),(48,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:03:11'),(49,'SELECT * FROM users',1,'/api/users','2026-04-14 17:03:14'),(50,'SELECT * FROM users',1,'/api/users','2026-04-14 17:04:04'),(51,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:04:07'),(52,'SELECT COUNT(*) AS totalCustomers FROM customer',4,'/dashboard-stats','2026-04-14 17:04:07'),(53,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:04:07'),(54,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:04:07'),(55,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:04:08'),(56,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',3,'/api/all-accounts','2026-04-14 17:04:08'),(57,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:04:09'),(58,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:04:10'),(59,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:04:16'),(60,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:04:17'),(61,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:04:17'),(62,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 17:05:49'),(63,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:05:49'),(64,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:06:11'),(65,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:06:11'),(66,'SELECT * FROM users',1,'/api/users','2026-04-14 17:06:18'),(67,'SELECT * FROM users',2,'/api/users','2026-04-14 17:08:33'),(68,'SELECT * FROM users',1,'/api/users','2026-04-14 17:08:52'),(69,'SELECT * FROM users',1,'/api/users','2026-04-14 17:09:10'),(70,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 17:09:11'),(71,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',3,'/slow-queries','2026-04-14 17:09:11'),(72,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:11'),(73,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:09:12'),(74,'SELECT * FROM customer',3,'/api/customers','2026-04-14 17:09:12'),(75,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',3,'/api/all-accounts','2026-04-14 17:09:12'),(76,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:09:12'),(77,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:09:12'),(78,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:09:12'),(79,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:09:12'),(80,'SELECT c.name, c.email, a.account_type, a.balance FROM customer c INNER JOIN account a ON c.customer_id = a.customer_id LIMIT 10',2,'/run-query','2026-04-14 17:09:21'),(81,'SELECT account_id, type, SUM(amount) AS total_volume FROM transactions GROUP BY account_id, type LIMIT 10',2,'/run-query','2026-04-14 17:09:22'),(82,'SELECT account_id, customer_id, balance FROM account WHERE balance > 1000 ORDER BY balance DESC LIMIT 10',2,'/run-query','2026-04-14 17:09:23'),(83,'SELECT account_id, COUNT(*) AS txn_count FROM transactions GROUP BY account_id HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:09:24'),(84,'SELECT account_id, balance FROM account ORDER BY balance DESC LIMIT 5',1,'/run-query','2026-04-14 17:09:25'),(85,'SELECT account_id, ROUND(AVG(amount), 2) AS avg_txn FROM transactions GROUP BY account_id LIMIT 10',1,'/run-query','2026-04-14 17:09:26'),(86,'SELECT a.account_id, a.balance FROM account a LEFT JOIN transactions t ON a.account_id = t.account_id WHERE t.transaction_id IS NULL LIMIT 10',1,'/run-query','2026-04-14 17:09:26'),(87,'SELECT DATE_FORMAT(date, \'%b-%Y\') AS month, SUM(amount) AS total FROM transactions GROUP BY month LIMIT 10',2,'/run-query','2026-04-14 17:09:27'),(88,'SELECT name FROM customer WHERE customer_id IN (SELECT customer_id FROM account GROUP BY customer_id HAVING COUNT(DISTINCT account_type) > 1) LIMIT 10',3,'/run-query','2026-04-14 17:09:28'),(89,'SELECT phone, COUNT(*) AS cnt FROM customer GROUP BY phone HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:09:30'),(90,'SELECT * FROM audit_log LIMIT 10',1,'/run-query','2026-04-14 17:09:30'),(91,'SELECT * FROM user_privileges LIMIT 10',1,'/run-query','2026-04-14 17:09:33'),(92,'SELECT * FROM audit_log ORDER BY performed_at DESC LIMIT 3',1,'/run-query','2026-04-14 17:09:34'),(93,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:09:41'),(94,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:09:41'),(95,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:09:41'),(96,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',2,'/dashboard-stats','2026-04-14 17:09:41'),(97,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:09:47'),(98,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:47'),(99,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:47'),(100,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:09:48'),(101,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:49'),(102,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:51'),(103,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:09:51'),(104,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:51'),(105,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:52'),(106,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:09:53'),(107,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',3,'/api/all-accounts','2026-04-14 17:09:53'),(108,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:53'),(109,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:09:53'),(110,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:53'),(111,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:54'),(112,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:09:54'),(113,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:54'),(114,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:55'),(115,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:09:56'),(116,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:09:56'),(117,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:09:58'),(118,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:09:58'),(119,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:09:59'),(120,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:09:59'),(121,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:10:00'),(122,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:10:01'),(123,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:10:02'),(124,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:10:02'),(125,'SELECT * FROM audit_log ORDER BY performed_at DESC',2,'/audit-log','2026-04-14 17:10:02'),(126,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:10:03'),(127,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:10:03'),(128,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:10:04'),(129,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:10:04'),(130,'SELECT * FROM users',1,'/api/users','2026-04-14 17:10:05'),(131,'SELECT * FROM users',1,'/api/users','2026-04-14 17:10:54'),(132,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:10:54'),(133,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:10:54'),(134,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:10:55'),(135,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:10:55'),(136,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:10:56'),(137,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:10:56'),(138,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:10:56'),(139,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:10:56'),(140,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:10:56'),(141,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:10:56'),(142,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:11:04'),(143,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:11:04'),(144,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:11:04'),(145,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:11:05'),(146,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:11:05'),(147,'SELECT * FROM users',2,'/api/users','2026-04-14 17:11:06'),(148,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:13:59'),(149,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:13:59'),(150,'SELECT COUNT(*) AS activeAccounts FROM account',2,'/dashboard-stats','2026-04-14 17:13:59'),(151,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:13:59'),(152,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:14:01'),(153,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:14:01'),(154,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:14:02'),(155,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 17:14:03'),(156,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:14:03'),(157,'SELECT * FROM users',1,'/api/users','2026-04-14 17:14:04'),(158,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 17:14:42'),(159,'SELECT COUNT(*) AS totalCustomers FROM customer',5,'/dashboard-stats','2026-04-14 17:14:42'),(160,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:14:42'),(161,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',4,'/dashboard-stats','2026-04-14 17:14:42'),(162,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:14:44'),(163,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:14:44'),(164,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:14:45'),(165,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',1,'/query-logs','2026-04-14 17:14:46'),(166,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:14:46'),(167,'SELECT * FROM users',0,'/api/users','2026-04-14 17:14:47'),(168,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',4,'/query-logs','2026-04-14 17:14:48'),(169,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:14:48'),(170,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:14:48'),(171,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:14:49'),(172,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:14:49'),(173,'SELECT * FROM users',1,'/api/users','2026-04-14 17:14:58'),(174,'EXPLAIN SELECT * FROM customer',6,'/run-query','2026-04-14 17:22:00'),(175,'SHOW INDEX FROM transactions',11,'/run-query','2026-04-14 17:22:06'),(176,'SELECT c.name, c.email, a.account_type, a.balance FROM customer c INNER JOIN account a ON c.customer_id = a.customer_id LIMIT 10',2,'/run-query','2026-04-14 17:22:37'),(177,'SELECT account_id, type, SUM(amount) AS total_volume FROM transactions GROUP BY account_id, type LIMIT 10',2,'/run-query','2026-04-14 17:22:38'),(178,'SELECT account_id, customer_id, balance FROM account WHERE balance > 1000 ORDER BY balance DESC LIMIT 10',1,'/run-query','2026-04-14 17:22:39'),(179,'SELECT c.name, c.email, a.account_type, a.balance FROM customer c INNER JOIN account a ON c.customer_id = a.customer_id LIMIT 10',1,'/run-query','2026-04-14 17:22:41'),(180,'SELECT account_id, type, SUM(amount) AS total_volume FROM transactions GROUP BY account_id, type LIMIT 10',1,'/run-query','2026-04-14 17:22:42'),(181,'SELECT account_id, customer_id, balance FROM account WHERE balance > 1000 ORDER BY balance DESC LIMIT 10',1,'/run-query','2026-04-14 17:22:43'),(182,'SELECT account_id, COUNT(*) AS txn_count FROM transactions GROUP BY account_id HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:22:44'),(183,'SELECT account_id, balance FROM account ORDER BY balance DESC LIMIT 5',2,'/run-query','2026-04-14 17:22:45'),(184,'SELECT account_id, ROUND(AVG(amount), 2) AS avg_txn FROM transactions GROUP BY account_id LIMIT 10',1,'/run-query','2026-04-14 17:22:45'),(185,'SELECT a.account_id, a.balance FROM account a LEFT JOIN transactions t ON a.account_id = t.account_id WHERE t.transaction_id IS NULL LIMIT 10',2,'/run-query','2026-04-14 17:22:46'),(186,'SELECT DATE_FORMAT(date, \'%b-%Y\') AS month, SUM(amount) AS total FROM transactions GROUP BY month LIMIT 10',1,'/run-query','2026-04-14 17:22:47'),(187,'SELECT name FROM customer WHERE customer_id IN (SELECT customer_id FROM account GROUP BY customer_id HAVING COUNT(DISTINCT account_type) > 1) LIMIT 10',2,'/run-query','2026-04-14 17:22:49'),(188,'SELECT phone, COUNT(*) AS cnt FROM customer GROUP BY phone HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:22:50'),(189,'SELECT * FROM audit_log LIMIT 10',1,'/run-query','2026-04-14 17:22:50'),(190,'EXPLAIN SELECT * FROM account WHERE customer_id = 1',2,'/run-query','2026-04-14 17:22:51'),(191,'SHOW INDEX FROM transactions',2,'/run-query','2026-04-14 17:22:52'),(192,'SELECT * FROM user_privileges LIMIT 10',1,'/run-query','2026-04-14 17:22:53'),(193,'SELECT * FROM audit_log ORDER BY performed_at DESC LIMIT 3',1,'/run-query','2026-04-14 17:22:54'),(194,'SELECT * FROM audit_log LIMIT 10',1,'/run-query','2026-04-14 17:22:59'),(195,'SELECT phone, COUNT(*) AS cnt FROM customer GROUP BY phone HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:23:00'),(196,'SELECT name FROM customer WHERE customer_id IN (SELECT customer_id FROM account GROUP BY customer_id HAVING COUNT(DISTINCT account_type) > 1) LIMIT 10',1,'/run-query','2026-04-14 17:23:02'),(197,'SELECT DATE_FORMAT(date, \'%b-%Y\') AS month, SUM(amount) AS total FROM transactions GROUP BY month LIMIT 10',1,'/run-query','2026-04-14 17:23:03'),(198,'SELECT a.account_id, a.balance FROM account a LEFT JOIN transactions t ON a.account_id = t.account_id WHERE t.transaction_id IS NULL LIMIT 10',1,'/run-query','2026-04-14 17:23:03'),(199,'SELECT account_id, ROUND(AVG(amount), 2) AS avg_txn FROM transactions GROUP BY account_id LIMIT 10',1,'/run-query','2026-04-14 17:23:04'),(200,'SELECT account_id, balance FROM account ORDER BY balance DESC LIMIT 5',1,'/run-query','2026-04-14 17:23:05'),(201,'SELECT account_id, COUNT(*) AS txn_count FROM transactions GROUP BY account_id HAVING COUNT(*) > 1 LIMIT 10',0,'/run-query','2026-04-14 17:23:07'),(202,'SELECT account_id, customer_id, balance FROM account WHERE balance > 1000 ORDER BY balance DESC LIMIT 10',1,'/run-query','2026-04-14 17:23:08'),(203,'SELECT account_id, type, SUM(amount) AS total_volume FROM transactions GROUP BY account_id, type LIMIT 10',0,'/run-query','2026-04-14 17:23:10'),(204,'SELECT c.name, c.email, a.account_type, a.balance FROM customer c INNER JOIN account a ON c.customer_id = a.customer_id LIMIT 10',1,'/run-query','2026-04-14 17:23:11'),(205,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 17:23:37'),(206,'SELECT COUNT(*) AS totalCustomers FROM customer',8,'/dashboard-stats','2026-04-14 17:23:37'),(207,'SELECT COUNT(*) AS activeAccounts FROM account',5,'/dashboard-stats','2026-04-14 17:23:37'),(208,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:23:37'),(209,'SELECT * FROM users WHERE username=?',1,'/login','2026-04-14 17:23:44'),(210,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:23:44'),(211,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:23:44'),(212,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:23:44'),(213,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:23:44'),(214,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:23:56'),(215,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:23:56'),(216,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:24:04'),(217,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:24:05'),(218,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',3,'/slow-queries','2026-04-14 17:24:05'),(219,'SELECT * FROM users',2,'/api/users','2026-04-14 17:24:06'),(220,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:24:09'),(221,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:24:09'),(222,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:24:09'),(223,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:24:09'),(224,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:25:39'),(225,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:25:39'),(226,'SELECT * FROM audit_log ORDER BY performed_at DESC',2,'/audit-log','2026-04-14 17:25:39'),(227,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:25:40'),(228,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:25:40'),(229,'SELECT * FROM users',1,'/api/users','2026-04-14 17:25:41'),(230,'SELECT c.name, c.email, a.account_type, a.balance FROM customer c INNER JOIN account a ON c.customer_id = a.customer_id LIMIT 10',1,'/run-query','2026-04-14 17:25:47'),(231,'SELECT account_id, type, SUM(amount) AS total_volume FROM transactions GROUP BY account_id, type LIMIT 10',1,'/run-query','2026-04-14 17:25:48'),(232,'SELECT account_id, customer_id, balance FROM account WHERE balance > 1000 ORDER BY balance DESC LIMIT 10',0,'/run-query','2026-04-14 17:25:48'),(233,'SELECT account_id, COUNT(*) AS txn_count FROM transactions GROUP BY account_id HAVING COUNT(*) > 1 LIMIT 10',1,'/run-query','2026-04-14 17:25:49'),(234,'SELECT account_id, balance FROM account ORDER BY balance DESC LIMIT 5',0,'/run-query','2026-04-14 17:25:51'),(235,'SELECT account_id, ROUND(AVG(amount), 2) AS avg_txn FROM transactions GROUP BY account_id LIMIT 10',1,'/run-query','2026-04-14 17:25:52'),(236,'SELECT a.account_id, a.balance FROM account a LEFT JOIN transactions t ON a.account_id = t.account_id WHERE t.transaction_id IS NULL LIMIT 10',1,'/run-query','2026-04-14 17:25:53'),(237,'SELECT DATE_FORMAT(date, \'%b-%Y\') AS month, SUM(amount) AS total FROM transactions GROUP BY month LIMIT 10',1,'/run-query','2026-04-14 17:25:54'),(238,'SELECT name FROM customer WHERE customer_id IN (SELECT customer_id FROM account GROUP BY customer_id HAVING COUNT(DISTINCT account_type) > 1) LIMIT 10',1,'/run-query','2026-04-14 17:25:55'),(239,'SELECT phone, COUNT(*) AS cnt FROM customer GROUP BY phone HAVING COUNT(*) > 1 LIMIT 10',0,'/run-query','2026-04-14 17:25:56'),(240,'SELECT * FROM audit_log LIMIT 10',1,'/run-query','2026-04-14 17:25:57'),(241,'EXPLAIN SELECT * FROM account WHERE customer_id = 1',1,'/run-query','2026-04-14 17:25:58'),(242,'SHOW INDEX FROM transactions',3,'/run-query','2026-04-14 17:25:59'),(243,'SELECT * FROM user_privileges LIMIT 10',0,'/run-query','2026-04-14 17:26:00'),(244,'SELECT * FROM audit_log ORDER BY performed_at DESC LIMIT 3',1,'/run-query','2026-04-14 17:26:01'),(245,'SELECT COUNT(*) AS totalCustomers FROM customer',7,'/dashboard-stats','2026-04-14 17:37:00'),(246,'SELECT * FROM customer ORDER BY customer_id DESC',12,'/customers','2026-04-14 17:37:00'),(247,'SELECT COUNT(*) AS activeAccounts FROM account',11,'/dashboard-stats','2026-04-14 17:37:00'),(248,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',8,'/dashboard-stats','2026-04-14 17:37:00'),(249,'SELECT * FROM users WHERE username=?',3,'/login','2026-04-14 17:37:06'),(250,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 17:37:06'),(251,'SELECT COUNT(*) AS totalCustomers FROM customer',5,'/dashboard-stats','2026-04-14 17:37:06'),(252,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:37:06'),(253,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:37:06'),(254,'SELECT * FROM users WHERE username=?',2,'/login','2026-04-14 17:37:26'),(255,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:26'),(256,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:40'),(257,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:41'),(258,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:41'),(259,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:42'),(260,'SELECT * FROM users WHERE username=?',1,'/login','2026-04-14 17:37:47'),(261,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:37:47'),(262,'SELECT * FROM account WHERE customer_id=?',1,'/my-accounts/:customerId','2026-04-14 17:38:06'),(263,'SELECT * FROM users WHERE username=?',1,'/login','2026-04-14 17:38:19'),(264,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:38:19'),(265,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:38:19'),(266,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:38:20'),(267,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:38:20'),(268,'SELECT * FROM customer ORDER BY customer_id DESC',2,'/customers','2026-04-14 17:42:54'),(269,'SELECT COUNT(*) AS totalCustomers FROM customer',5,'/dashboard-stats','2026-04-14 17:42:54'),(270,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:42:54'),(271,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',2,'/dashboard-stats','2026-04-14 17:42:54'),(272,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:42:55'),(273,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:42:55'),(274,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:42:55'),(275,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:42:55'),(276,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:46:32'),(277,'SELECT COUNT(*) AS totalCustomers FROM customer',2,'/dashboard-stats','2026-04-14 17:46:32'),(278,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:46:32'),(279,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',0,'/dashboard-stats','2026-04-14 17:46:32'),(280,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:46:42'),(281,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:46:42'),(282,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:46:46'),(283,'SELECT COUNT(*) AS totalCustomers FROM customer',4,'/dashboard-stats','2026-04-14 17:46:46'),(284,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:46:46'),(285,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:46:46'),(286,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:46:49'),(287,'SELECT * FROM customer',4,'/api/customers','2026-04-14 17:47:07'),(288,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',4,'/api/all-accounts','2026-04-14 17:47:07'),(289,'SELECT * FROM audit_log ORDER BY performed_at DESC',2,'/audit-log','2026-04-14 17:47:08'),(290,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',3,'/query-logs','2026-04-14 17:47:09'),(291,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',3,'/slow-queries','2026-04-14 17:47:09'),(292,'SELECT * FROM users',2,'/api/users','2026-04-14 17:47:09'),(293,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:48:25'),(294,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:48:25'),(295,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:48:25'),(296,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:48:25'),(297,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:48:28'),(298,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:48:28'),(299,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:48:28'),(300,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:48:31'),(301,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:48:31'),(302,'SELECT * FROM users WHERE username=?',1,'/login','2026-04-14 17:50:02'),(303,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:50:02'),(304,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:50:02'),(305,'INSERT INTO account (customer_id,account_type,balance) VALUES (?,?,?)',9,'/createAccount','2026-04-14 17:50:12'),(306,'SELECT * FROM customer',2,'/api/customers','2026-04-14 17:50:15'),(307,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:50:15'),(308,'SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC',2,'/history/:accountId','2026-04-14 17:50:17'),(309,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:50:17'),(310,'SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC',1,'/history/:accountId','2026-04-14 17:50:36'),(311,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:50:36'),(312,'SELECT * FROM transactions WHERE account_id=? ORDER BY date DESC',1,'/history/:accountId','2026-04-14 17:50:48'),(313,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',1,'/api/all-accounts','2026-04-14 17:50:48'),(314,'SELECT * FROM customer',1,'/api/customers','2026-04-14 17:51:07'),(315,'SELECT a.*, c.name FROM account a JOIN customer c ON a.customer_id = c.customer_id',2,'/api/all-accounts','2026-04-14 17:51:07'),(316,'SELECT * FROM audit_log ORDER BY performed_at DESC',1,'/audit-log','2026-04-14 17:51:08'),(317,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:51:31'),(318,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',3,'/query-logs','2026-04-14 17:51:31'),(319,'select * from users;',1,'/run-query','2026-04-14 17:52:04'),(320,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:52:04'),(321,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:52:04'),(322,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',3,'/query-logs','2026-04-14 17:53:37'),(323,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:53:37'),(324,'select * from users;',1,'/run-query','2026-04-14 17:53:45'),(325,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:53:45'),(326,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:53:45'),(327,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:53:55'),(328,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:53:55'),(329,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:53:55'),(330,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:53:55'),(331,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:53:55'),(332,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:53:55'),(333,'select * from users;',1,'/run-query','2026-04-14 17:54:05'),(334,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:54:05'),(335,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:54:05'),(336,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:55:11'),(337,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:55:11'),(338,'select * from users;',1,'/run-query','2026-04-14 17:55:21'),(339,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',1,'/slow-queries','2026-04-14 17:55:21'),(340,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:55:21'),(341,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:56:39'),(342,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:56:39'),(343,'select * from users;',1,'/run-query','2026-04-14 17:56:53'),(344,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',2,'/slow-queries','2026-04-14 17:56:53'),(345,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',3,'/query-logs','2026-04-14 17:56:53'),(346,'select * from customers;',2,'/run-query','2026-04-14 17:57:05'),(347,'select * from customer;',1,'/run-query','2026-04-14 17:57:11'),(348,'SELECT * FROM query_logs ORDER BY timestamp DESC LIMIT 100',2,'/query-logs','2026-04-14 17:57:11'),(349,'SELECT * FROM query_logs WHERE execution_time_ms > 50 ORDER BY execution_time_ms DESC LIMIT 20',4,'/slow-queries','2026-04-14 17:57:11'),(350,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:57:24'),(351,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:57:24'),(352,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:57:24'),(353,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',0,'/dashboard-stats','2026-04-14 17:57:24'),(354,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:57:51'),(355,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:57:51'),(356,'SELECT COUNT(*) AS activeAccounts FROM account',3,'/dashboard-stats','2026-04-14 17:57:51'),(357,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:57:51'),(358,'SELECT * FROM customer ORDER BY customer_id DESC',0,'/customers','2026-04-14 17:57:51'),(359,'SELECT COUNT(*) AS totalCustomers FROM customer',2,'/dashboard-stats','2026-04-14 17:57:51'),(360,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:57:51'),(361,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',0,'/dashboard-stats','2026-04-14 17:57:51'),(362,'SELECT * FROM customer ORDER BY customer_id DESC',1,'/customers','2026-04-14 17:57:52'),(363,'SELECT COUNT(*) AS totalCustomers FROM customer',3,'/dashboard-stats','2026-04-14 17:57:52'),(364,'SELECT COUNT(*) AS activeAccounts FROM account',1,'/dashboard-stats','2026-04-14 17:57:52'),(365,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-14 17:57:52'),(366,'SELECT COUNT(*) AS totalCustomers FROM customer',31,'/dashboard-stats','2026-04-15 04:19:04'),(367,'SELECT * FROM customer ORDER BY customer_id DESC',23,'/customers','2026-04-15 04:19:04'),(368,'SELECT COUNT(*) AS activeAccounts FROM account',14,'/dashboard-stats','2026-04-15 04:19:04'),(369,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',17,'/dashboard-stats','2026-04-15 04:19:04'),(370,'SELECT * FROM users WHERE username=?',16,'/login','2026-04-15 04:19:19'),(371,'SELECT * FROM customer ORDER BY customer_id DESC',3,'/customers','2026-04-15 04:19:19'),(372,'SELECT COUNT(*) AS totalCustomers FROM customer',15,'/dashboard-stats','2026-04-15 04:19:19'),(373,'SELECT COUNT(*) AS activeAccounts FROM account',3,'/dashboard-stats','2026-04-15 04:19:19'),(374,'SELECT COUNT(*) AS todayAdditions FROM customer WHERE DATE(created_at) = CURDATE()',1,'/dashboard-stats','2026-04-15 04:19:19');
/*!40000 ALTER TABLE `query_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(20) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'admin','Administrator with full system access and privilege assignment capabilities','2026-04-14 16:56:43'),(2,'teller','Staff member managing customer accounts and processing transactions','2026-04-14 16:56:43'),(3,'customer','End-user with view-only access to their own accounts','2026-04-14 16:56:43');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactions` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `account_id` int DEFAULT NULL,
  `amount` decimal(10,2) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transaction_id`),
  KEY `account_id` (`account_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `account` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,10000.00,'withdraw','2026-04-14 17:50:36'),(2,1,20000.00,'deposit','2026-04-14 17:50:48');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_transaction_insert` AFTER INSERT ON `transactions` FOR EACH ROW BEGIN
    INSERT INTO audit_log (table_name, action, new_value, performed_by)
    VALUES ('transactions', 'INSERT', CONCAT('TxnID: ', NEW.transaction_id, ', Acc: ', NEW.account_id, ', Amt: ', NEW.amount, ', Type: ', NEW.type), COALESCE(@app_user, USER()));
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `user_privileges`
--

DROP TABLE IF EXISTS `user_privileges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_privileges` (
  `privilege_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `privilege_name` varchar(50) NOT NULL,
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `granted_by` varchar(50) DEFAULT 'System',
  PRIMARY KEY (`privilege_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_privileges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_privileges`
--

LOCK TABLES `user_privileges` WRITE;
/*!40000 ALTER TABLE `user_privileges` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_privileges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) DEFAULT NULL,
  `position` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `customer_id` int DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `customer_id` (`customer_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customer` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$V6/o2RJ3w6M.FWa3MNwlxulI86wuWvvaXzz6doenKOaAruhmghS.a','admin','Head Database Administrator','admin@nexbank.com',1,'2026-04-14 16:56:43',NULL),(2,'teller','$2b$10$oFqiaWPWz9yCo1YkPqZUeeTuEHh5KxSmFZvb75fFsgyalV39Xh.oa','teller','Senior Branch Teller','teller@nexbank.com',1,'2026-04-14 16:56:43',NULL),(3,'cust1','$2b$10$qfLcy2eBvLNsUeAvgYx1p.MiUrYYgACVWm45.PibA68BL6OauCpRy','customer',NULL,'cust1@example.com',1,'2026-04-14 16:56:43',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_unicode_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_user_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    IF NEW.role = 'admin' THEN
        INSERT INTO user_privileges (user_id, privilege_name) VALUES 
        (NEW.user_id, 'VIEW_ACCOUNTS'), (NEW.user_id, 'MANAGE_CUSTOMERS'), 
        (NEW.user_id, 'PROCESS_TRANSACTIONS'), (NEW.user_id, 'VIEW_REPORTS'), 
        (NEW.user_id, 'MANAGE_USERS'), (NEW.user_id, 'AUDIT_ACCESS');
    ELSEIF NEW.role = 'teller' THEN
        INSERT INTO user_privileges (user_id, privilege_name) VALUES 
        (NEW.user_id, 'VIEW_ACCOUNTS'), (NEW.user_id, 'MANAGE_CUSTOMERS'), 
        (NEW.user_id, 'PROCESS_TRANSACTIONS');
    ELSE
        INSERT INTO user_privileges (user_id, privilege_name) VALUES 
        (NEW.user_id, 'VIEW_ACCOUNTS');
    END IF;
    
    INSERT INTO audit_log (table_name, action, new_value, performed_by)
    VALUES ('users', 'INSERT_PRIVS', CONCAT('Assigned default privileges for ', NEW.username), 'System_Trigger');
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-15  9:49:41
