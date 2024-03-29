import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      'Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local'
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Get the ID and type
  const eventType = evt.type;
  const prisma = new PrismaClient();

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const {
      id,
      first_name,
      last_name,
      primary_email_address_id,
      ...attributes
    } = evt.data;

    const username = (await clerkClient.users.getUser(id)).username;
    const emailAddress = (
      await clerkClient.emailAddresses.getEmailAddress(primary_email_address_id)
    ).emailAddress;

    await prisma.user.upsert({
      where: { externalId: id as string },
      create: {
        externalId: id as string,
        username: username as string,
        first_name: first_name,
        last_name: last_name,
        emailAddress: emailAddress,
        attributes: JSON.stringify(attributes),
      },
      update: {
        username: username as string,
        first_name: first_name,
        last_name: last_name,
        emailAddress: emailAddress,
        attributes: JSON.stringify(attributes),
      },
    });
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    await prisma.user.delete({
      where: { externalId: id as string },
    });
  }

  return new Response('', { status: 200 });
}
