import amqp from "amqplib";

const RABBIT_URL = process.env.RABBIT_URL || "amqp://user:pass@localhost:5672";
const QUEUE = process.env.RABBIT_QUEUE || "animalshelters.events";

let connection = null;
let channel = null;

async function connectRabbit() {
  if (channel) return channel;

  connection = await amqp.connect(RABBIT_URL);
  channel = await connection.createChannel();

  await channel.assertQueue(QUEUE, { durable: true });
  await channel.prefetch(1);

  return channel;
}

export async function publishEvent(event) {
  const ch = await connectRabbit();
  ch.sendToQueue(QUEUE, Buffer.from(JSON.stringify(event)), { persistent: true });
}

export async function consumeEvents(handler) {
  const ch = await connectRabbit();

  ch.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    await handler(data);
    ch.ack(msg);
  });
}

// PS ....\AnimalShelters> docker compose up -d
