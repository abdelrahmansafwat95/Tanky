import { db, pool } from "./index";
import {
  companiesTable,
  usersTable,
  driversTable,
  vehiclesTable,
  stationsTable,
  pumpsTable,
  stationAttendantsTable,
  fuelPricesTable,
  budgetAllocationsTable,
} from "./schema";
import crypto from "node:crypto";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

async function seed() {
  console.log("Seeding FuelGo database...");

  const [company] = await db
    .insert(companiesTable)
    .values({
      nameEn: "Cairo Express Logistics",
      nameAr: "كايرو إكسبرس لوجستيك",
      commercialRegisterNo: "CR-2024-001234",
      taxId: "TAX-EG-987654321",
      address: "12 Tahrir Street, Downtown",
      city: "Cairo",
      governorate: "Cairo",
      contactPerson: "Mohamed Saad",
      contactPhone: "+201001234567",
      contactEmail: "ops@cairoexpress.eg",
      creditLimitEgp: "100000.00",
      status: "active",
    })
    .returning();
  console.log("  Company:", company.nameEn);

  const [adminUser] = await db
    .insert(usersTable)
    .values({
      email: "admin@cairoexpress.eg",
      phone: "+201001234567",
      passwordHash: sha256("ChangeMe123!"),
      fullName: "Mohamed Saad",
      role: "company_admin",
      companyId: company.id,
      isActive: true,
    })
    .returning();
  console.log("  Admin user:", adminUser.email);

  const [driverUser] = await db
    .insert(usersTable)
    .values({
      email: "ahmed.hassan@cairoexpress.eg",
      phone: "+201112345678",
      passwordHash: sha256("DriverPass123!"),
      fullName: "Ahmed Hassan",
      role: "driver",
      companyId: company.id,
      isActive: true,
    })
    .returning();

  const [vehicle] = await db
    .insert(vehiclesTable)
    .values({
      companyId: company.id,
      plateNumber: "ج ص ر 4521",
      make: "Toyota",
      model: "Hilux",
      year: 2023,
      color: "White",
      fuelType: "diesel",
      tankCapacityLiters: "80.00",
      nfcTagUid: "04:A1:B2:C3:D4:E5:80",
      monthlyBudgetEgp: "8500.00",
      dailyBudgetEgp: "500.00",
      odometerKm: 12450,
      status: "active",
    })
    .returning();
  console.log("  Vehicle:", vehicle.plateNumber);

  const [driver] = await db
    .insert(driversTable)
    .values({
      userId: driverUser.id,
      companyId: company.id,
      employeeId: "EMP-2841",
      nationalId: "29001011234567",
      licenseNumber: "EG-DL-9988776",
      licenseExpiry: "2027-12-31",
      assignedVehicleId: vehicle.id,
      dailyLimitEgp: "500.00",
      monthlyLimitEgp: "8500.00",
      pinHash: sha256("1234"),
      status: "active",
    })
    .returning();
  console.log("  Driver:", driver.employeeId);

  const stationsData = [
    {
      name: "Wataniya - Maadi",
      brand: "wataniya" as const,
      address: "Autostrad Road, Maadi",
      city: "Cairo",
      governorate: "Cairo",
      latitude: "29.9602",
      longitude: "31.2569",
      phone: "+20225200001",
      is24Hours: "true",
    },
    {
      name: "ChillOut - Nasr City",
      brand: "chillout" as const,
      address: "El Nasr Road, Nasr City",
      city: "Cairo",
      governorate: "Cairo",
      latitude: "30.0561",
      longitude: "31.3447",
      phone: "+20226700002",
      is24Hours: "true",
    },
    {
      name: "TotalEnergies - Zamalek",
      brand: "totalenergies" as const,
      address: "26 July Corridor, Zamalek",
      city: "Cairo",
      governorate: "Cairo",
      latitude: "30.0626",
      longitude: "31.2197",
      phone: "+20227350003",
      is24Hours: "false",
      openingTime: "06:00",
      closingTime: "00:00",
    },
  ];

  const insertedStations = await db
    .insert(stationsTable)
    .values(stationsData)
    .returning();
  console.log("  Stations:", insertedStations.length);

  for (const station of insertedStations) {
    for (let i = 1; i <= 4; i++) {
      await db.insert(pumpsTable).values({
        stationId: station.id,
        pumpNumber: i,
        qrCodeToken: randomToken(),
        serialNumber: `${station.brand.toUpperCase()}-P${i}`,
        supportedFuelTypes:
          i % 2 === 0
            ? ["diesel", "gasoline_92"]
            : ["gasoline_92", "gasoline_95"],
        status: "available",
      });
    }
  }
  console.log("  Pumps: 4 per station");

  await db.insert(fuelPricesTable).values([
    { fuelType: "gasoline_80", pricePerLiterEgp: "12.500" },
    { fuelType: "gasoline_92", pricePerLiterEgp: "14.000" },
    { fuelType: "gasoline_95", pricePerLiterEgp: "17.000" },
    { fuelType: "diesel", pricePerLiterEgp: "12.500" },
  ]);
  console.log("  Fuel prices set");

  const [attendantUser] = await db
    .insert(usersTable)
    .values({
      email: "attendant.maadi@wataniya.eg",
      phone: "+201223334444",
      passwordHash: sha256("AttendantPass123!"),
      fullName: "Karim El Sayed",
      role: "station_attendant",
      stationId: insertedStations[0].id,
      isActive: true,
    })
    .returning();

  await db.insert(stationAttendantsTable).values({
    userId: attendantUser.id,
    stationId: insertedStations[0].id,
    employeeNumber: "WAT-001",
    nationalId: "28505051234567",
    pinHash: sha256("4321"),
    shiftStart: "06:00",
    shiftEnd: "18:00",
    status: "active",
  });
  console.log("  Attendant:", attendantUser.fullName);

  await db.insert(budgetAllocationsTable).values({
    companyId: company.id,
    vehicleId: vehicle.id,
    type: "vehicle_allocation",
    amountEgp: "8500.00",
    description: "Initial monthly fuel budget for Toyota Hilux ج ص ر 4521",
    referenceNumber: "INIT-2026-04",
    createdByUserId: adminUser.id,
  });

  console.log("\nSeed complete.");
  await pool.end();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  await pool.end();
  process.exit(1);
});
