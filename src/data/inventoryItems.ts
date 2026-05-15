// Shared inventory items data, used by both Inventory Management and the
// Catalog form (for "Link to Inventory" / "Ingredients" UX). Keeps a single
// source of truth so changing items in one place does not desync the other.
import type { InventoryItem } from "@/components/inventory/InventoryItemForm";

export const defaultInventoryItems: InventoryItem[] = [
  // Restaurant (outlet-1, outlet-3)
  { id: "i1", name: "Coffee Beans (Arabica)", sku: "CB-001", categoryId: "1", unitId: "1", stock: 45, minStock: 20, costPrice: 12.5, status: "good", conversions: [{ id: "cv1", fromQuantity: 1, toQuantity: 50, toUnitId: "5" }], outletId: "outlet-1" },
  { id: "i2", name: "Whole Milk", sku: "ML-001", categoryId: "1", unitId: "3", stock: 12, minStock: 15, costPrice: 1.2, status: "low", conversions: [{ id: "cv2", fromQuantity: 1, toQuantity: 1000, toUnitId: "4" }], outletId: "outlet-1" },
  { id: "i3", name: "Sugar", sku: "SG-001", categoryId: "2", unitId: "1", stock: 30, minStock: 10, costPrice: 0.8, status: "good", conversions: [{ id: "cv3", fromQuantity: 1, toQuantity: 1000, toUnitId: "2" }], outletId: "outlet-1" },
  { id: "i4", name: "Paper Cups (12oz)", sku: "PC-012", categoryId: "3", unitId: "5", stock: 150, minStock: 200, costPrice: 0.05, status: "low", conversions: [], outletId: "outlet-3" },
  { id: "i5", name: "Croissant Dough", sku: "CD-001", categoryId: "2", unitId: "1", stock: 8, minStock: 5, costPrice: 3.0, status: "good", conversions: [{ id: "cv4", fromQuantity: 1, toQuantity: 10, toUnitId: "5" }], outletId: "outlet-3" },
  // Retail (outlet-2)
  { id: "i9", name: "Sandwich Bread", sku: "SB-001", categoryId: "2", unitId: "9", stock: 24, minStock: 10, costPrice: 1.5, status: "good", conversions: [], outletId: "outlet-2" },
  { id: "i10", name: "Napkins", sku: "NP-001", categoryId: "3", unitId: "5", stock: 500, minStock: 200, costPrice: 0.01, status: "good", conversions: [], outletId: "outlet-2" },
  // Pharmacy (outlet-4)
  { id: "i11", name: "Paracetamol 500mg", sku: "PH-001", categoryId: "5", unitId: "10", stock: 200, minStock: 50, costPrice: 0.15, status: "good", conversions: [{ id: "cv5", fromQuantity: 1, toQuantity: 12, toUnitId: "16" }], outletId: "outlet-4", batches: [
    { id: "b11a", batchNumber: "2025-09-01 10:00", expiryDate: "2026-04-15", quantity: 50, initialQuantity: 80, costPrice: 0.15, createdAt: "2025-09-01T10:00:00Z" },
    { id: "b11b", batchNumber: "2026-01-05 09:30", expiryDate: "2027-06-15", quantity: 100, initialQuantity: 100, costPrice: 0.14, createdAt: "2026-01-05T09:30:00Z" },
    { id: "b11c", batchNumber: "2026-02-14 14:00", expiryDate: "2028-01-10", quantity: 50, initialQuantity: 50, costPrice: 0.16, createdAt: "2026-02-14T14:00:00Z" },
  ] },
  { id: "i12", name: "Amoxicillin 250mg", sku: "PH-002", categoryId: "5", unitId: "10", stock: 80, minStock: 30, costPrice: 0.45, status: "good", conversions: [], outletId: "outlet-4", batches: [
    { id: "b12a", batchNumber: "2025-06-30 08:00", expiryDate: "2026-05-01", quantity: 30, initialQuantity: 50, costPrice: 0.45, createdAt: "2025-06-30T08:00:00Z" },
    { id: "b12b", batchNumber: "2026-01-10 11:00", expiryDate: "2026-12-01", quantity: 50, initialQuantity: 50, costPrice: 0.44, createdAt: "2026-01-10T11:00:00Z" },
  ] },
  { id: "i13", name: "Vitamin C 1000mg", sku: "PH-003", categoryId: "5", unitId: "7", stock: 15, minStock: 20, costPrice: 3.5, status: "low", conversions: [], outletId: "outlet-4", batches: [
    { id: "b13a", batchNumber: "2025-04-28 09:00", expiryDate: "2026-04-10", quantity: 5, initialQuantity: 20, costPrice: 3.5, createdAt: "2025-04-28T09:00:00Z" },
    { id: "b13b", batchNumber: "2026-01-15 13:00", expiryDate: "2026-09-20", quantity: 10, initialQuantity: 10, costPrice: 3.6, createdAt: "2026-01-15T13:00:00Z" },
  ] },
  { id: "i14", name: "Cough Syrup", sku: "PH-004", categoryId: "5", unitId: "7", stock: 40, minStock: 15, costPrice: 2.8, status: "good", conversions: [], outletId: "outlet-4", batches: [
    { id: "b14a", batchNumber: "2026-02-14 10:00", expiryDate: "2028-01-30", quantity: 40, initialQuantity: 40, costPrice: 2.8, createdAt: "2026-02-14T10:00:00Z" },
  ] },
  { id: "i15", name: "First Aid Bandages", sku: "PH-005", categoryId: "5", unitId: "6", stock: 5, minStock: 10, costPrice: 4.0, status: "critical", conversions: [], outletId: "outlet-4", batches: [
    { id: "b15a", batchNumber: "2025-07-19 08:30", expiryDate: "2026-02-15", quantity: 5, initialQuantity: 15, costPrice: 4.0, createdAt: "2025-07-19T08:30:00Z" },
  ] },
  // Salon (outlet-5)
  { id: "i6", name: "Shampoo (Professional)", sku: "SH-001", categoryId: "4", unitId: "7", stock: 3, minStock: 5, costPrice: 8.0, status: "critical", conversions: [], outletId: "outlet-5" },
  { id: "i7", name: "Hair Color Mix", sku: "HC-001", categoryId: "4", unitId: "8", stock: 18, minStock: 10, costPrice: 5.5, status: "good", conversions: [], outletId: "outlet-5" },
  { id: "i8", name: "Disposable Gloves", sku: "DG-001", categoryId: "4", unitId: "6", stock: 2, minStock: 5, costPrice: 4.0, status: "critical", conversions: [], outletId: "outlet-5" },
  { id: "i16", name: "Conditioner (Deep)", sku: "SL-002", categoryId: "4", unitId: "7", stock: 10, minStock: 5, costPrice: 9.0, status: "good", conversions: [], outletId: "outlet-5" },
  { id: "i17", name: "Hair Clips (Assorted)", sku: "SL-003", categoryId: "4", unitId: "10", stock: 50, minStock: 20, costPrice: 0.3, status: "good", conversions: [], outletId: "outlet-5" },
  // Barber (outlet-6)
  { id: "i18", name: "Clipper Oil", sku: "BR-001", categoryId: "4", unitId: "7", stock: 6, minStock: 3, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-6" },
  { id: "i19", name: "Aftershave Lotion", sku: "BR-002", categoryId: "4", unitId: "7", stock: 8, minStock: 5, costPrice: 6.0, status: "good", conversions: [], outletId: "outlet-6" },
  { id: "i20", name: "Razor Blades", sku: "BR-003", categoryId: "4", unitId: "10", stock: 10, minStock: 20, costPrice: 0.8, status: "low", conversions: [], outletId: "outlet-6" },
  { id: "i21", name: "Shaving Cream", sku: "BR-004", categoryId: "4", unitId: "8", stock: 12, minStock: 5, costPrice: 3.0, status: "good", conversions: [], outletId: "outlet-6" },
  // Grocery (outlet-7)
  { id: "i22", name: "Tomatoes (Fresh)", sku: "GR-001", categoryId: "6", unitId: "1", stock: 60, minStock: 20, costPrice: 1.2, status: "good", conversions: [], outletId: "outlet-7", batches: [
    { id: "b22a", batchNumber: "2026-03-01 07:00", expiryDate: "2026-04-05", quantity: 25, initialQuantity: 30, costPrice: 1.2, createdAt: "2026-03-01T07:00:00Z" },
    { id: "b22b", batchNumber: "2026-03-15 08:00", expiryDate: "2026-04-20", quantity: 35, initialQuantity: 35, costPrice: 1.15, createdAt: "2026-03-15T08:00:00Z" },
  ] },
  { id: "i23", name: "Onions", sku: "GR-002", categoryId: "6", unitId: "1", stock: 40, minStock: 15, costPrice: 0.8, status: "good", conversions: [], outletId: "outlet-7" },
  { id: "i24", name: "Palm Oil", sku: "GR-003", categoryId: "12", unitId: "3", stock: 25, minStock: 10, costPrice: 3.5, status: "good", conversions: [], outletId: "outlet-7", batches: [
    { id: "b24a", batchNumber: "2026-03-01 09:00", expiryDate: "2027-03-20", quantity: 25, initialQuantity: 25, costPrice: 3.5, createdAt: "2026-03-01T09:00:00Z" },
  ] },
  { id: "i25", name: "Basmati Rice 5kg", sku: "GR-004", categoryId: "12", unitId: "5", stock: 8, minStock: 15, costPrice: 8.0, status: "low", conversions: [], outletId: "outlet-7", batches: [
    { id: "b25a", batchNumber: "2025-03-29 10:00", expiryDate: "2026-05-15", quantity: 3, initialQuantity: 10, costPrice: 7.8, createdAt: "2025-03-29T10:00:00Z" },
    { id: "b25b", batchNumber: "2026-01-22 11:00", expiryDate: "2026-09-15", quantity: 5, initialQuantity: 5, costPrice: 8.2, createdAt: "2026-01-22T11:00:00Z" },
  ] },
  { id: "i26", name: "Instant Noodles (Carton)", sku: "GR-005", categoryId: "12", unitId: "11", stock: 14, minStock: 5, costPrice: 12.0, status: "good", conversions: [{ id: "cv6", fromQuantity: 1, toQuantity: 40, toUnitId: "5" }], outletId: "outlet-7", batches: [
    { id: "b26a", batchNumber: "2026-01-12 12:00", expiryDate: "2026-06-10", quantity: 6, initialQuantity: 10, costPrice: 11.5, createdAt: "2026-01-12T12:00:00Z" },
    { id: "b26b", batchNumber: "2026-01-30 14:00", expiryDate: "2027-01-10", quantity: 8, initialQuantity: 8, costPrice: 12.0, createdAt: "2026-01-30T14:00:00Z" },
  ] },
  // Supermarket (outlet-8)
  { id: "i27", name: "Full Cream Milk 1L", sku: "SM-001", categoryId: "7", unitId: "11", stock: 30, minStock: 20, costPrice: 1.8, status: "good", conversions: [{ id: "cv7", fromQuantity: 1, toQuantity: 12, toUnitId: "5" }], outletId: "outlet-8", batches: [
    { id: "b27a", batchNumber: "2026-02-01 06:00", expiryDate: "2026-04-12", quantity: 10, initialQuantity: 20, costPrice: 1.8, createdAt: "2026-02-01T06:00:00Z" },
    { id: "b27b", batchNumber: "2026-03-01 07:00", expiryDate: "2026-05-25", quantity: 20, initialQuantity: 20, costPrice: 1.85, createdAt: "2026-03-01T07:00:00Z" },
  ] },
  { id: "i28", name: "Cheddar Cheese Block", sku: "SM-002", categoryId: "7", unitId: "5", stock: 18, minStock: 10, costPrice: 5.5, status: "good", conversions: [], outletId: "outlet-8", batches: [
    { id: "b28a", batchNumber: "2026-01-15 09:00", expiryDate: "2026-04-30", quantity: 8, initialQuantity: 12, costPrice: 5.5, createdAt: "2026-01-15T09:00:00Z" },
    { id: "b28b", batchNumber: "2026-03-10 10:00", expiryDate: "2026-06-30", quantity: 10, initialQuantity: 10, costPrice: 5.6, createdAt: "2026-03-10T10:00:00Z" },
  ] },
  { id: "i29", name: "Frozen Chicken Wings 1kg", sku: "SM-003", categoryId: "7", unitId: "10", stock: 12, minStock: 20, costPrice: 6.0, status: "low", conversions: [], outletId: "outlet-8", batches: [
    { id: "b29a", batchNumber: "2026-02-01 08:00", expiryDate: "2026-05-15", quantity: 4, initialQuantity: 10, costPrice: 5.8, createdAt: "2026-02-01T08:00:00Z" },
    { id: "b29b", batchNumber: "2026-03-05 09:00", expiryDate: "2026-08-15", quantity: 8, initialQuantity: 8, costPrice: 6.2, createdAt: "2026-03-05T09:00:00Z" },
  ] },
  { id: "i30", name: "Toilet Tissue (Pack 12)", sku: "SM-004", categoryId: "3", unitId: "10", stock: 45, minStock: 15, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-8" },
  { id: "i31", name: "Detergent 2kg", sku: "SM-005", categoryId: "3", unitId: "5", stock: 22, minStock: 10, costPrice: 3.2, status: "good", conversions: [], outletId: "outlet-8" },
  // Wine & Liquor (outlet-9)
  { id: "i32", name: "Cabernet Sauvignon Reserve", sku: "WN-001", categoryId: "8", unitId: "7", stock: 24, minStock: 10, costPrice: 15.0, status: "good", conversions: [], outletId: "outlet-9" },
  { id: "i33", name: "Hennessy VS 750ml", sku: "WN-002", categoryId: "8", unitId: "7", stock: 8, minStock: 5, costPrice: 35.0, status: "good", conversions: [], outletId: "outlet-9" },
  { id: "i34", name: "Prosecco Brut", sku: "WN-003", categoryId: "8", unitId: "7", stock: 3, minStock: 6, costPrice: 12.0, status: "critical", conversions: [], outletId: "outlet-9" },
  { id: "i35", name: "Tonic Water (Pack 6)", sku: "WN-004", categoryId: "8", unitId: "10", stock: 20, minStock: 10, costPrice: 4.0, status: "good", conversions: [], outletId: "outlet-9" },
  // Clothing (outlet-10)
  { id: "i36", name: "Cotton T-Shirt Blank (White)", sku: "CL-001", categoryId: "9", unitId: "5", stock: 120, minStock: 30, costPrice: 3.5, status: "good", conversions: [], outletId: "outlet-10" },
  { id: "i37", name: "Denim Jeans (Unisex)", sku: "CL-002", categoryId: "9", unitId: "5", stock: 45, minStock: 15, costPrice: 12.0, status: "good", conversions: [], outletId: "outlet-10" },
  { id: "i38", name: "Sneakers (Running)", sku: "CL-003", categoryId: "9", unitId: "12", stock: 8, minStock: 10, costPrice: 25.0, status: "low", conversions: [], outletId: "outlet-10" },
  { id: "i39", name: "Leather Belt", sku: "CL-004", categoryId: "9", unitId: "5", stock: 30, minStock: 10, costPrice: 6.0, status: "good", conversions: [], outletId: "outlet-10" },
  // Electronics (outlet-11)
  { id: "i40", name: "USB-C Charging Cable", sku: "EL-001", categoryId: "10", unitId: "5", stock: 200, minStock: 50, costPrice: 1.5, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i41", name: "Wireless Earbuds", sku: "EL-002", categoryId: "10", unitId: "5", stock: 35, minStock: 15, costPrice: 18.0, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i42", name: "Phone Screen Protector", sku: "EL-003", categoryId: "10", unitId: "10", stock: 80, minStock: 30, costPrice: 0.8, status: "good", conversions: [], outletId: "outlet-11" },
  { id: "i43", name: "Power Bank 10000mAh", sku: "EL-004", categoryId: "10", unitId: "5", stock: 4, minStock: 10, costPrice: 12.0, status: "critical", conversions: [], outletId: "outlet-11" },
  { id: "i44", name: "Bluetooth Speaker", sku: "EL-005", categoryId: "10", unitId: "5", stock: 15, minStock: 8, costPrice: 22.0, status: "good", conversions: [], outletId: "outlet-11" },
  // Hair / Wig Store (outlet-12)
  { id: "i45", name: "Brazilian Body Wave 18\"", sku: "HW-001", categoryId: "11", unitId: "5", stock: 20, minStock: 8, costPrice: 45.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i46", name: "Lace Front Wig (Bob)", sku: "HW-002", categoryId: "11", unitId: "5", stock: 6, minStock: 5, costPrice: 65.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i47", name: "Closure 4x4 Straight", sku: "HW-003", categoryId: "11", unitId: "5", stock: 12, minStock: 5, costPrice: 30.0, status: "good", conversions: [], outletId: "outlet-12" },
  { id: "i48", name: "Wig Cap (Mesh)", sku: "HW-004", categoryId: "11", unitId: "10", stock: 3, minStock: 10, costPrice: 1.0, status: "critical", conversions: [], outletId: "outlet-12" },
  { id: "i49", name: "Edge Control Gel", sku: "HW-005", categoryId: "11", unitId: "5", stock: 25, minStock: 10, costPrice: 4.5, status: "good", conversions: [], outletId: "outlet-12" },
  // ============ Substitution test items (outlet-1) ============
  // These power the "Substitution Tests" composite items in the cashier POS.
  // Stock levels are deliberately set to trigger each substitution mode.
  { id: "sub-bun-classic",  name: "Classic Burger Bun", sku: "TST-BUN-1", categoryId: "2", unitId: "5", stock: 0,  minStock: 10, costPrice: 1.20, status: "critical", conversions: [], outletId: "outlet-1" },
  { id: "sub-bun-sesame",   name: "Sesame Bun",         sku: "TST-BUN-2", categoryId: "2", unitId: "5", stock: 40, minStock: 10, costPrice: 1.10, status: "good",     conversions: [], outletId: "outlet-1" },
  { id: "sub-bun-brioche",  name: "Brioche Bun",        sku: "TST-BUN-3", categoryId: "2", unitId: "5", stock: 25, minStock: 10, costPrice: 1.80, status: "good",     conversions: [], outletId: "outlet-1" },
  { id: "sub-patty-chicken",name: "Chicken Patty",      sku: "TST-PT-1",  categoryId: "2", unitId: "5", stock: 0,  minStock: 10, costPrice: 3.00, status: "critical", conversions: [], outletId: "outlet-1" },
  { id: "sub-patty-spicy",  name: "Spicy Chicken Patty",sku: "TST-PT-2",  categoryId: "2", unitId: "5", stock: 18, minStock: 5,  costPrice: 3.20, status: "good",     conversions: [], outletId: "outlet-1" },
  { id: "sub-patty-veggie", name: "Veggie Patty",       sku: "TST-PT-3",  categoryId: "2", unitId: "5", stock: 12, minStock: 5,  costPrice: 2.50, status: "good",     conversions: [], outletId: "outlet-1" },
  { id: "sub-cheese",       name: "Cheddar Slice",      sku: "TST-CH-1",  categoryId: "1", unitId: "5", stock: 50, minStock: 10, costPrice: 0.40, status: "good",     conversions: [], outletId: "outlet-1" },
  // Sauce items — used by the MULTI consolidated-approval test composite.
  { id: "sub-sauce-bbq",    name: "BBQ Sauce",          sku: "TST-SC-1",  categoryId: "1", unitId: "5", stock: 0,  minStock: 5,  costPrice: 0.60, status: "critical", conversions: [], outletId: "outlet-1" },
  { id: "sub-sauce-honey",  name: "Honey Mustard Sauce",sku: "TST-SC-2",  categoryId: "1", unitId: "5", stock: 20, minStock: 5,  costPrice: 0.70, status: "good",     conversions: [], outletId: "outlet-1" },
  { id: "sub-sauce-garlic", name: "Garlic Aioli",       sku: "TST-SC-3",  categoryId: "1", unitId: "5", stock: 15, minStock: 5,  costPrice: 0.80, status: "good",     conversions: [], outletId: "outlet-1" },
];
