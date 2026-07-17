// budget: 400 lines
import { Prisma } from '../generated/prisma/client';

// Canonical include used for every appointment query so responses always
// carry the related client + service needed for flattening.
export const appointmentInclude = {
  client: true,
  service: true,
} satisfies Prisma.AppointmentInclude;

type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude;
}>;

// Flattened shape the Angular frontend consumes (clientName, serviceName, price)
// while still exposing the nested relations for any richer consumer.
export function shapeAppointment(a: AppointmentWithRelations) {
  return {
    id: a.id,
    clientId: a.clientId,
    serviceId: a.serviceId,
    createdById: a.createdById,
    startTime: a.startTime,
    status: a.status,
    createdAt: a.createdAt,
    clientName: a.client?.name ?? '',
    serviceName: a.service?.name ?? '',
    price: a.service?.price ?? 0,
    client: a.client,
    service: a.service,
  };
}
