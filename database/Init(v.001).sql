/*============================================================================
 DigitalArs - Billetera Virtual
 Script 000: Inicialización de la base de datos
 Autor: Beta Squad
 ============================================================================ */

IF DB_ID(N'DigitalArs') IS NULL
    CREATE DATABASE DigitalArs COLLATE Modern_Spanish_CI_AS;
GO

USE DigitalArs;
GO
