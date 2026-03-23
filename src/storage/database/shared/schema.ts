import { pgTable, serial, timestamp, varchar, text, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 设备质保表
export const warrantyRecords = pgTable(
  "warranty_records",
  {
    id: serial().notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    stationName: varchar("station_name", { length: 255 }).notNull(),
    warrantyEndDate: timestamp("warranty_end_date", { withTimezone: true, mode: 'string' }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("warranty_records_station_name_idx").on(table.stationName),
  ]
);
