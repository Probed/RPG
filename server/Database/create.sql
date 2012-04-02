CREATE DATABASE rpg;

﻿USE rpg;

CREATE TABLE `user` (
  `userID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(25) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `passwordHash` varchar(100) NOT NULL,
  `verifyKey` varchar(100) DEFAULT NULL,
  `apiKey` varchar(255) DEFAULT NULL,
  `role` int(11) NOT NULL,
  `enabled` bit(1) NOT NULL,
  `emailUpdates` bit(1) NOT NULL,
  `settings` mediumtext CHARACTER SET latin1,
  `created` datetime NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastLogin` datetime DEFAULT NULL,
  PRIMARY KEY (`userID`),
  KEY `User_name` (`name`),
  KEY `User_email` (`apiKey`),
  KEY `User_passwodHash` using HASH (`passwordHash`),
  KEY `User_apiKey` using HASH (`apiKey`),
  KEY `User_verifyKey` using HASH (`verifyKey`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `universes` (
  `universeID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `universeName` varchar(100) NOT NULL,
  `options` mediumtext CHARACTER SET latin1 NOT NULL,
  `userID` int(10) UNSIGNED NOT NULL,
  `created` datetime NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`universeID`),
  KEY `Universes_userID` (`userID`),
  KEY `Universes_universeName` (`universeName`),
  CONSTRAINT `Universes_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `characters` (
  `characterID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userID` int(10) UNSIGNED NOT NULL,
  `name` varchar(20) NOT NULL,
  `options` mediumtext CHARACTER SET latin1 NOT NULL,
  `updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created` datetime NOT NULL,
  PRIMARY KEY (`characterID`),
  KEY `FK_character_userID` (`userID`),
  KEY `Character_name` (`name`),
  CONSTRAINT `FK_character_userID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `maps` (
  `mapID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `universeID` int(10) UNSIGNED NOT NULL,
  `mapName` varchar(100) NOT NULL,
  `options` text CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`mapID`),
  KEY `Maps_universeID` (`universeID`),
  KEY `Maps_mapName` (`mapName`),
  CONSTRAINT `Maps_universeID` FOREIGN KEY (`universeID`) REFERENCES `universes` (`universeID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `mapscache` (
  `mapCacheID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `mapID` int(10) UNSIGNED NOT NULL,
  `folderName` varchar(20) NOT NULL,
  `path` varchar(255) NOT NULL,
  `tileName` varchar(100) NOT NULL,
  `options` mediumtext CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`mapCacheID`),
  KEY `MapCache_tileName` (`tileName`),
  KEY `MapCache_path` (`path`),
  KEY `MapCache_folderName` (`folderName`),
  KEY `MapCache_mapID` (`mapID`),
  CONSTRAINT `MapCache_mapID` FOREIGN KEY (`mapID`) REFERENCES `maps` (`mapID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `maptiles` (
  `tileID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `mapID` int(10) UNSIGNED NOT NULL,
  `tiles` text CHARACTER SET latin1 NOT NULL,
  `point` point NOT NULL,
  PRIMARY KEY (`tileID`),
  KEY `mapTiles_mapIDIndex` (`mapID`),
  KEY `MapTiles_point_index` (point),
/*SPATIAL INDEX `MapTiles_point` (point),
  FULLTEXT INDEX `mapTiles_tiles` (`tiles`),*/
  CONSTRAINT `MapTiles_mapID` FOREIGN KEY (`mapID`) REFERENCES `maps` (`mapID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `tilesets` (
  `tilesetID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `category` varchar(100) NOT NULL,
  `options` text CHARACTER SET latin1 NOT NULL,
  `userID` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`tilesetID`),
  KEY `Tilesets_userID` (`userID`),
  KEY `Tilesets_name` (`name`),
  KEY `Tilesets_category` (`category`),
  CONSTRAINT `Tilesets_UserID` FOREIGN KEY (`userID`) REFERENCES `user` (`userID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `tilesetscache` (
  `tilesetCacheID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tilesetID` int(10) UNSIGNED NOT NULL,
  `folderName` varchar(20) NOT NULL,
  `path` varchar(255) NOT NULL,
  `tileName` varchar(100) NOT NULL,
  `options` mediumtext CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`tilesetCacheID`),
  KEY `TilesetsCache_tilesetID` (`tilesetID`),
  KEY `TilesetsCache_folderName` (`folderName`),
  KEY `TilesetsCache_path` (`path`),
  KEY `TilesetsCache_tileName` (`tileName`),
  CONSTRAINT `TilesetsCache_TilesetID` FOREIGN KEY (`tilesetID`) REFERENCES `tilesets` (`tilesetID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `tilesettiles` (
  `tileID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tilesetID` int(10) UNSIGNED NOT NULL,
  `tiles` text CHARACTER SET latin1 NOT NULL,
  `point` point NOT NULL,
  PRIMARY KEY (`tileID`),
  KEY `TilesetTiles_tilesetID` (`tilesetID`),
  KEY `TilesetTiles_point_index` (point),
/*SPATIAL INDEX `TilesetTiles_point` (point),
  FULLTEXT INDEX `TilesetTiles_tiles` (`tiles`),*/
  CONSTRAINT `TilesetTiles_tilesetID` FOREIGN KEY (`tilesetID`) REFERENCES `tilesets` (`tilesetID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `inventorycache` (
  `inventoryCacheID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `characterID` int(10) UNSIGNED NOT NULL,
  `folderName` varchar(20) NOT NULL,
  `path` varchar(255) NOT NULL,
  `tileName` varchar(100) NOT NULL,
  `options` mediumtext CHARACTER SET latin1 NOT NULL,
  PRIMARY KEY (`inventoryCacheID`),
  KEY `InventoryCache_tileName` (`tileName`),
  KEY `InventoryCache_path` (`path`),
  KEY `InventoryCache_folderName` (`folderName`),
  KEY `InventoryCache_characterID` (`characterID`),
  CONSTRAINT `InventoryCache_characterID` FOREIGN KEY (`characterID`) REFERENCES `characters` (`characterID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

/*
CREATE TABLE `visitedtiles` (
  `visitID` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `characterID` int(10) UNSIGNED NOT NULL,
  `tileID` int(10) UNSIGNED NOT NULL,
  `options` mediumtext CHARACTER SET latin1,
  `visitDate` date NOT NULL,
  PRIMARY KEY (`visitID`),
  KEY `VisitedTiles_tileID_MapTiles_tileID` (`tileID`),
  KEY `VisitedTiles_characterID_Characters_characterID` (`characterID`),
  CONSTRAINT `VisitedTiles_tileID_MapTiles_tileID` FOREIGN KEY (`tileID`) REFERENCES `maptiles` (`tileID`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `VisitedTiles_characterID_Characters_characterID` FOREIGN KEY (`characterID`) REFERENCES `characters` (`characterID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
*/

GRANT SELECT, INSERT, UPDATE ON `user` TO 'rpg_player'@'localhost' IDENTIFIED BY PASSWORD '*6F934DB89E9B576A915D4EC69F29F118AAA6866A';
GRANT SELECT, INSERT, UPDATE, DELETE ON `universes` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `maps` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `mapscache` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `maptiles` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `characters` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `tilesets` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `tilesetscache` TO 'rpg_player'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON `tilesettiles` TO 'rpg_player'@'localhost';
/*GRANT SELECT, INSERT, UPDATE, DELETE ON `visitedtiles` TO 'rpg_player'@'localhost';*/