import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '../src/infrastructure/database/prisma.js';
import { PrismaOrderRepository } from '../src/modules/orders/prisma-order.repository.js';

const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DIRECT_URL or DATABASE_URL is required');
}

const database = createPrismaClient(databaseUrl);
const orders = new PrismaOrderRepository(database);
const runId = randomUUID();
const customerEmail = `order-verification-${runId}@example.invalid`;
let customerId: string | undefined;
let vehicleId: string | undefined;
let orderId: string | undefined;

try {
  const customer = await database.user.create({
    data: {
      email: customerEmail,
      passwordHash: 'verification-only',
      role: 'CUSTOMER',
    },
  });
  customerId = customer.id;

  const vehicle = await database.vehicle.create({
    data: {
      make: 'Verification',
      model: runId,
      year: 2026,
      category: 'Test',
      imageKey: 'WHITE_RR',
      colorName: 'Verification Silver',
      colorHex: '#C8C9C7',
      engine: 'Verification engine',
      transmission: 'AUTOMATIC',
      fuelType: 'ELECTRIC',
      details: 'Temporary row used by the self-cleaning order verification.',
      price: '1.00',
      quantity: 2,
    },
  });
  vehicleId = vehicle.id;

  const reservation = await orders.reserve(customer.id, vehicle.id, 1);

  if (
    reservation.status !== 'UPDATED' ||
    reservation.vehicle.quantity !== 1 ||
    reservation.order.vehicle.make !== 'Verification'
  ) {
    throw new Error('Reservation did not atomically decrement stock and persist its snapshot');
  }
  orderId = reservation.order.id;

  const history = await orders.findForUser(customer.id, { limit: 6, skip: 0 });

  if (history.pagination.total !== 1 || history.orders[0]?.id !== orderId) {
    throw new Error('Customer order history did not return the reservation');
  }

  const cancellation = await orders.cancel(orderId, customer.id);

  if (
    cancellation.status !== 'UPDATED' ||
    cancellation.order.status !== 'CANCELLED' ||
    cancellation.vehicle.quantity !== 2
  ) {
    throw new Error('Cancellation did not atomically restore stock');
  }

  const repeatedCancellation = await orders.cancel(orderId, customer.id);

  if (repeatedCancellation.status !== 'ALREADY_CANCELLED') {
    throw new Error('Repeated cancellation was not rejected');
  }

  console.log(
    JSON.stringify(
      {
        cancellation: cancellation.order.status,
        historyCount: history.pagination.total,
        repeatedCancellation: repeatedCancellation.status,
        restoredQuantity: cancellation.vehicle.quantity,
      },
      null,
      2,
    ),
  );
} finally {
  if (orderId) {
    await database.order.deleteMany({ where: { id: orderId } });
  }
  if (vehicleId) {
    await database.vehicle.deleteMany({ where: { id: vehicleId } });
  }
  if (customerId) {
    await database.user.deleteMany({ where: { id: customerId } });
  }
  await database.$disconnect();
}
