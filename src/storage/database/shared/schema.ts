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
    // Excel 文件信息
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileUrl: text("file_url").notNull(),
    // 设备信息
    afterSalesCode: varchar("after_sales_code", { length: 100 }),
    warrantyStatus: varchar("warranty_status", { length: 50 }),
    factoryDate: varchar("factory_date", { length: 50 }),
    factoryNumber: varchar("factory_number", { length: 100 }),
    pileNumber: varchar("pile_number", { length: 100 }),
    productCode: varchar("product_code", { length: 100 }),
    deviceType: varchar("device_type", { length: 100 }),
    deviceName: varchar("device_name", { length: 200 }),
    productModel: varchar("product_model", { length: 200 }),
    manufacturer: varchar("manufacturer", { length: 200 }),
    // 场站信息
    stationName: varchar("station_name", { length: 255 }).notNull(),
    province: varchar("province", { length: 100 }),
    city: varchar("city", { length: 100 }),
    district: varchar("district", { length: 100 }),
    stationAddress: varchar("station_address", { length: 500 }),
    customer: varchar("customer", { length: 200 }),
    maintainer: varchar("maintainer", { length: 200 }),
    // 质保信息
    warrantyPeriod: varchar("warranty_period", { length: 100 }),
    warrantyStartDate: timestamp("warranty_start_date", { withTimezone: true, mode: 'string' }),
    warrantyEndDate: timestamp("warranty_end_date", { withTimezone: true, mode: 'string' }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
  },
  (table) => [
    index("warranty_records_station_name_idx").on(table.stationName),
    index("warranty_records_after_sales_code_idx").on(table.afterSalesCode),
  ]
);
