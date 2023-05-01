
    SELECT COUNT(customerScheduleId) AS countUser, stationsName
    FROM CustomerSchedule 
    LEFT JOIN Stations ON CustomerSchedule.stationsId = Stations.stationsId
    WHERE CustomerSchedule.isDeleted = 0
    GROUP BY Stations.stationsId
    
    SELECT COUNT(customerScheduleId) AS countUser, dateSchedule
    FROM CustomerSchedule 
--     LEFT JOIN Stations ON CustomerSchedule.stationsId = Stations.stationsId
    WHERE CustomerSchedule.isDeleted = 0
    GROUP BY dateSchedule
    
    SELECT COUNT(stationsId) FROM Stations
    WHERE stationBookingConfig LIKE '%"enableBooking":1%'
    
    SELECT COUNT(stationsId), stationArea FROM Stations
    WHERE stationBookingConfig LIKE '%"enableBooking":1%'
    GROUP BY stationArea
--     SELECT phoneNumber, firstName FROM AppUser WHERE isVerifiedPhoneNumber = 0 and appUserRoleId = 0 ORDER BY phoneNumber ASC

-- SELECT CustomerSchedule.phone, licensePlates, fullnameSchedule FROM CustomerSchedule WHERE CustomerScheduleStatus = 30
-- SELECT CustomerSchedule.phone, licensePlates, fullnameSchedule FROM CustomerSchedule WHERE CustomerScheduleStatus = 20
SHOW KEYS FROM AppUserVehicle WHERE Key_name = 'PRIMARY' AS ta
SELECT COUNT(stationsId), stationStatus FROM Stations GROUP BY stationStatus
SELECT appUserVehicleId ,vehicleExpiryDate, DATE_FORMAT(vehicleExpiryDate, '%d/%m/%Y')FROM AppUserVehicle
SELECT vehicleExpiryDate FROM AppUserVehicle WHERE vehicleExpiryDate = 'Invalid date'

-- UPDATE AppUserVehicle SET vehicleExpiryDate = NULL WHERE vehicleExpiryDate = 'Invalid date' 
-- UPDATE AppUserVehicle SET vehicleExpiryDate = DATE_FORMAT(vehicleExpiryDate, '%d/%m/%Y') WHERE vehicleExpiryDate LIKE '%000%'
-- UPDATE AppUser 
-- SET twoFAQR = REPLACE(twoFAQR, 'cdn.kiemdinhoto.vn','cdn.ttdk.com.vn')
-- WHERE twoFAQR LIKE '%cdn.kiemdinhoto.vn%'