# Tracking System Specifications

## 1. Weight Breakdown

### Table 2: Estimated Weight of the Tracker Components
| Component | Estimated Weight (g) |
| :--- | :---: |
| ESP32-C3 Mini Microcontroller | 4 |
| GY-NEO6MV2 (NEO-6M) GPS Module | 1.6 |
| SX1276 LoRa Transceiver Module | 3 |
| TP4056 Battery Charging Module | 2 |
| MT3608 DC-DC Step-Up Converter | 3 |
| 3.7V 100 mAh LiPo Battery | 1.6 |
| 5V 50mA 60mm × 44mm solar panel | 20 |
| ABS Enclosure (58 × 92 × 23) | 26 |
| Adjustable Collar | 25 |
| Connecting Wires and Mounting Hardware | 10 |
| **Total Estimated Weight** | **96.2** |

---

## 2. Power & Energy Consumption

### Tracker Device Power Consumption
| Component | Total Energy Consumed (mW-hr/day) |
| :--- | :---: |
| GY-NEO6MV2 NEO-6M Ublox | 21.6 |
| ESP32-C3 Mini | 4.0 |
| SX1276 915MHz @ 13dBm | 0.06 |
| **Total** | **25.66** |

### Tracker Battery Specifications (Energy-Based)
| Parameter | Value |
| :--- | :--- |
| Battery Capacity | 370 mWh |
| Estimated Battery Runtime | 346.06 hours (14 days, 10 hours) |

### Master Device Power Consumption
| Component | Current Consumption (mW) |
| :--- | :---: |
| ESP32-C3 Mini | 1155 |
| Micro SD Card Module | 50 |
| SX1276 915MHz | 0.6 |
| **Total** | **1205.6** |

### Alternative / Continuous Battery Runtime
| Parameter | Value |
| :--- | :--- |
| Battery Capacity | 100 mAh |
| Estimated Battery Runtime | 15.46 hours |

---

## 3. Physical Dimensions

### Tracker and Master Device Dimensions
| Parameters | Measurement (mm) |
| :--- | :---: |
| Length | 100 |
| Width | 60 |
| Height | 30 |

### Collar Strap Dimensions
| Parameters | Measurement (mm) |
| :--- | :---: |
| Length | 580 |
| Width | 35 |