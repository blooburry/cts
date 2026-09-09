import { object, coerce, string, optional, number, literal } from 'zod'
import * as z from 'zod'

export const BewegingsSensorMessageDTO = object({
    clientId: string(),
    date: coerce.date(),
    message: literal(["beweging geconstateerd", "apparaat uit", "error"]),
    value: optional(number()),
    errorMessage: optional(string())
});

export type BewegingsSensorMessage = z.infer<typeof BewegingsSensorMessageDTO>;

export const ConfigureLampMessageDTO = object({
    maxBrightness: number(),
    date: coerce.date(),
    timeInterval: number(),
})

export type ConfigureLampMessage = z.infer<typeof ConfigureLampMessageDTO>;
