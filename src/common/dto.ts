import { object, coerce, string, optional, number, literal, tuple } from "zod";
import * as z from "zod";

export const BewegingsSensorMessageDTO = object({
  sensorClientId: string(),
  date: coerce.date(),
  message: literal(["beweging geconstateerd", "apparaat uit", "error"]),
  value: optional(number()),
  errorMessage: optional(string()),
});

export type BewegingsSensorMessage = z.infer<typeof BewegingsSensorMessageDTO>;

export const ConfigureLampMessageDTO = object({
  maxBrightness: optional(number()),
  date: coerce.date(),
  blinkPeriod: optional(number()),
  color: optional(object({r: number(), g: number(), b: number()})),
});

export type ConfigureLampMessage = z.infer<typeof ConfigureLampMessageDTO>;

export const ControlLampMessageDTO = object({
  status: literal(["on", "off"]),
  date: coerce.date(),
});

export type ControlLampMessage = z.infer<typeof ControlLampMessageDTO>;
