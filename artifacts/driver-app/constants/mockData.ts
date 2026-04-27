export const DRIVER_PROFILE = {
  id: "EMP-2841",
  name: "Ahmed Hassan",
  company: "Cairo Express Logistics",
  vehicle: {
    makeModel: "Toyota Hilux 2023",
    plate: "ج ص ر 4521"
  },
  budget: {
    total: 8500,
    used: 5230
  }
};

export const STATIONS = [
  {
    id: "s1",
    brand: "Wataniya",
    name: "Wataniya - Maadi",
    address: "Autostrad Road, Maadi, Cairo",
    distance: "2.4 km",
    openNow: true,
    is24_7: true,
    fuelPrices: {
      diesel: 12.50,
      octane92: 14.00,
      octane95: 17.00
    }
  },
  {
    id: "s2",
    brand: "ChillOut",
    name: "ChillOut - Nasr City",
    address: "El Nasr Road, Nasr City, Cairo",
    distance: "5.1 km",
    openNow: true,
    is24_7: true,
    fuelPrices: {
      diesel: 12.50,
      octane92: 14.00,
      octane95: 17.00
    }
  },
  {
    id: "s3",
    brand: "TotalEnergies",
    name: "TotalEnergies - Zamalek",
    address: "26 July Corridor, Zamalek, Cairo",
    distance: "3.8 km",
    openNow: true,
    is24_7: false,
    fuelPrices: {
      diesel: 12.50,
      octane92: 14.00,
      octane95: 17.00
    }
  }
];

export const TRANSACTIONS = [
  {
    id: "TXN-8921",
    date: new Date().toISOString(),
    stationId: "s1",
    litres: 45.2,
    amount: 565.00,
    status: "completed",
    fuelType: "Diesel",
    pricePerLitre: 12.50
  },
  {
    id: "TXN-8920",
    date: new Date(Date.now() - 86400000).toISOString(),
    stationId: "s2",
    litres: 60.0,
    amount: 750.00,
    status: "completed",
    fuelType: "Diesel",
    pricePerLitre: 12.50
  }
];
