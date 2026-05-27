import { pgTable, serial, varchar, integer, decimal, date, time } from 'drizzle-orm/pg-core';

// 1. Tabla: Customer
export const customer = pgTable('Customer', {
  customerId: serial('customer_id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
});

// 2. Tabla: Admin
export const admin = pgTable('Admin', {
  adminId: serial('admin_id').primaryKey(),
  clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
  fullName: varchar('full_name', { length: 150 }).notNull(),
});

// 3. Tabla: Vehicle
export const vehicle = pgTable('Vehicle', {
  vehicleId: serial('vehicle_id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customer.customerId, { onDelete: 'cascade' }),
  weight: decimal('weight', { precision: 10, scale: 2 }),
  brand: varchar('brand', { length: 100 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),
  year: integer('year').notNull(),
});

// 4. Tabla: Trip
export const trip = pgTable('Trip', {
  tripId: serial('trip_id').primaryKey(),
  customerId: integer('customer_id')
    .notNull()
    .references(() => customer.customerId, { onDelete: 'cascade' }),
  vehicleId: integer('vehicle_id')
    .references(() => vehicle.vehicleId, { onDelete: 'set null' }),
  towerId: varchar('tower_id', { length: 255 }),
  originChar: varchar('origin_char', { length: 255 }),
  DestinationChar: varchar('destination_char', { length: 255 }),
  // Coordenadas de Origen
  originLat: decimal('origin_lat', { precision: 9, scale: 6 }).notNull(),
  originLng: decimal('origin_lng', { precision: 9, scale: 6 }).notNull(),
  
  // Coordenadas de Destino
  destinationLat: decimal('destination_lat', { precision: 9, scale: 6 }).notNull(),
  destinationLng: decimal('destination_lng', { precision: 9, scale: 6 }).notNull(),
  
  feedbackId: varchar('feedback_id', { length: 50 }),
  date: date('date').notNull(),
  time: time('time').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
});

