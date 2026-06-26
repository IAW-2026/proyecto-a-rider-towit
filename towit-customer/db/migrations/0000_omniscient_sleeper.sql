CREATE TABLE "Customer" (
	"customer_id" serial PRIMARY KEY NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"full_name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "Customer_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "Trip" (
	"trip_id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"vehicle_id" integer,
	"tower_id" varchar(255),
	"origin_char" varchar(255),
	"destination_char" varchar(255),
	"origin_lat" numeric(9, 6) NOT NULL,
	"origin_lng" numeric(9, 6) NOT NULL,
	"destination_lat" numeric(9, 6) NOT NULL,
	"destination_lng" numeric(9, 6) NOT NULL,
	"date" date NOT NULL,
	"time" time NOT NULL,
	"status" varchar(50) NOT NULL,
	"estimated_price" numeric(10, 2),
	"preferred_tow_type" varchar(50),
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Vehicle" (
	"vehicle_id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"weight" numeric(10, 2),
	"brand" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_customer_id_Customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicle_id_Vehicle_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."Vehicle"("vehicle_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_customer_id_Customer_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE cascade ON UPDATE no action;