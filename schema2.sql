create database lifestream2;
use lifestream2;
CREATE TABLE BloodGroups (
    BloodGroupID INT AUTO_INCREMENT PRIMARY KEY,
    BloodType VARCHAR(15) NOT NULL UNIQUE
);

CREATE TABLE Recipients (
    RecipientID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL UNIQUE,
    Contact VARCHAR(20)
);

CREATE TABLE Donors (
    DonorID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Contact VARCHAR(20) NOT NULL UNIQUE,
    Location VARCHAR(255),
    BloodGroupID INT,
    LastDonationDate DATE,
    FOREIGN KEY (BloodGroupID) REFERENCES BloodGroups(BloodGroupID)
);

CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Username VARCHAR(255) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'Staff', 'Recipient') NOT NULL,
    RecipientID INT, 
    FOREIGN KEY (RecipientID) REFERENCES Recipients(RecipientID) ON DELETE SET NULL
);

CREATE TABLE BloodStock (
    StockID INT AUTO_INCREMENT PRIMARY KEY,
    DonorID INT,
    BloodGroupID INT NOT NULL,
    QuantityML INT NOT NULL DEFAULT 470,
    CollectionDate DATE NOT NULL,
    ExpiryDate DATE NOT NULL,
    Status ENUM('Available', 'Used', 'Expired') DEFAULT 'Available',
    FOREIGN KEY (DonorID) REFERENCES Donors(DonorID),
    FOREIGN KEY (BloodGroupID) REFERENCES BloodGroups(BloodGroupID)
);

CREATE TABLE BloodRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    RecipientID INT, -- The ID of the hospital that needs blood
    BloodGroupID INT,
    QuantityRequiredML INT NOT NULL,
    RequestDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Pending', 'Fulfilled', 'Cancelled') DEFAULT 'Pending',
    FulfilledByUserID INT, -- The ID of the staff/admin who fulfilled it
    FOREIGN KEY (RecipientID) REFERENCES Recipients(RecipientID),
    FOREIGN KEY (BloodGroupID) REFERENCES BloodGroups(BloodGroupID),
    FOREIGN KEY (FulfilledByUserID) REFERENCES Users(UserID)
);

INSERT INTO BloodGroups (BloodType) VALUES
    ('A+'), ('A-'), ('B+'), ('B-'), ('AB+'), ('AB-'), ('O+'), ('O-'), ('Oh(Bombay)');

INSERT INTO Users (Name, Username, Password, Role, RecipientID) 
VALUES (
    'Default Admin', 
    'admin',
    '$2b$10$hlFIFTBGrDtEPDSpC9E75etyKqYEMmEHXsBasrd5uEEEASohoX78u',
    'Admin',
    NULL 
);
