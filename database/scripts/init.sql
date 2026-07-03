-- =============================================================================
-- ToyShop — Database Initialization Script
-- =============================================================================
-- This script creates the database if it does not exist.
-- Prisma manages schema migrations; this file is for database-level setup.
-- =============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ToyShop')
BEGIN
    CREATE DATABASE [ToyShop];
    PRINT 'Database ToyShop created.';
END
ELSE
BEGIN
    PRINT 'Database ToyShop already exists.';
END
GO

USE [ToyShop];
GO
