CREATE TABLE `ajustes` (
	`clave` varchar(64) NOT NULL,
	`valor` varchar(255) NOT NULL,
	CONSTRAINT `ajustes_clave` PRIMARY KEY(`clave`)
);
--> statement-breakpoint
CREATE TABLE `reservas_eventos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reserva_id` int NOT NULL,
	`accion` varchar(40) NOT NULL,
	`detalle` varchar(600) NOT NULL DEFAULT '',
	`creado_en` datetime NOT NULL,
	CONSTRAINT `reservas_eventos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(12) NOT NULL,
	`fecha` date NOT NULL,
	`hora` varchar(5) NOT NULL,
	`servicio` varchar(32) NOT NULL,
	`personas` smallint NOT NULL,
	`nombre` varchar(120) NOT NULL,
	`email` varchar(254),
	`telefono` varchar(32),
	`comentarios` varchar(600) NOT NULL DEFAULT '',
	`estado` enum('pendiente','confirmada','rechazada','cancelada') NOT NULL DEFAULT 'pendiente',
	`origen` enum('web','telefono','admin') NOT NULL DEFAULT 'web',
	`token_cancelacion` char(64),
	`consentimiento_en` datetime,
	`anonimizada_en` datetime,
	`creada_en` datetime NOT NULL,
	`actualizada_en` datetime NOT NULL,
	CONSTRAINT `reservas_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservas_codigo_uq` UNIQUE(`codigo`)
);
--> statement-breakpoint
ALTER TABLE `reservas_eventos` ADD CONSTRAINT `reservas_eventos_reserva_id_reservas_id_fk` FOREIGN KEY (`reserva_id`) REFERENCES `reservas`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `eventos_reserva_idx` ON `reservas_eventos` (`reserva_id`);--> statement-breakpoint
CREATE INDEX `reservas_fecha_servicio_idx` ON `reservas` (`fecha`,`servicio`,`estado`);--> statement-breakpoint
CREATE INDEX `reservas_email_idx` ON `reservas` (`email`);