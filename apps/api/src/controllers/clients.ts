import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { track } from "../lib/hog";
import { requirePermission } from "../lib/roles";
import { prisma } from "../prisma";

export function clientRoutes(fastify: FastifyInstance) {
  // Register a new client
  fastify.post(
    "/api/v1/client/create",
    {
      preHandler: requirePermission(["client::create"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name, email, number, contactName }: any = request.body;

      const client = await prisma.client.create({
        data: {
          name,
          email,
          contactName,
          number: String(number),
        },
      });

      const hog = track();

      hog.capture({
        event: "client_created",
        distinctId: client.id,
      });

      reply.send({
        success: true,
      });
    },
  );

  // Update client
  fastify.post(
    "/api/v1/client/update",
    {
      preHandler: requirePermission(["client::update"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { name, email, number, contactName, id }: any = request.body;

      await prisma.client.update({
        where: { id: id },
        data: {
          name,
          contactName,
          email,
          number: String(number),
        },
      });

      reply.send({
        success: true,
      });
    },
  );

  // Get all clients
  fastify.get(
    "/api/v1/clients/all",
    {
      preHandler: requirePermission(["client::read"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clients = await prisma.client.findMany({});

      reply.send({
        success: true,
        clients: clients,
      });
    },
  );

  // Delete client
  fastify.delete(
    "/api/v1/clients/:id/delete-client",
    {
      preHandler: requirePermission(["client::delete"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id }: any = request.params;

      await prisma.client.delete({
        where: { id: id },
      });

      reply.send({
        success: true,
      });
    },
  );

  // Get store of client
  fastify.get(
    "/api/v1/clients/:clientId/stores",
    {
      preHandler: requirePermission(["store::read"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { clientId }: any = request.params;

      const stores = await prisma.store.findMany({
        where: { clientId },
        include: { tags: { select: { id: true, value: true } } },
      });

      reply.send({
        success: true,
        stores: stores,
      });
    },
  );

  // get all tags for a client
  fastify.get("/api/v1/tags/:clientId", async (request, reply) => {
    const { clientId }: any = request.params;

    const tags = await prisma.tag.findMany({
      where: { clientId },
      select: { id: true, value: true },
    });

    reply.send({ success: true, tags });
  });

  // create a new tag for a client
  fastify.post("/api/v1/tags/:clientId", async (request, reply) => {
    const { value }: any = request.body;
    const { clientId }: any = request.params;

    const tag = await prisma.tag.create({
      data: { value, clientId, },
      select: { id: true, value: true },
    });

    const hog = track();

    hog.capture({
      distinctId: tag.id,
      event: "tag_created",
    });

    reply.send({ success: true, tag });
  });

  // create store for a client
  fastify.post(
    "/api/v1/clients/:clientId/stores",
    {
      preHandler: requirePermission(["store::create"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { clientId }: any = request.params;
      const { name, email, phone, address, manager, notes, tags }: any =
        request.body;

      const store = await prisma.store.create({
        data: {
          name,
          email,
          phone,
          address,
          manager,
          clientId,
          notes: notes?.filter(Boolean),
          tags: {
            connect: tags?.map((tagId: string) => ({ id: tagId })),
          },
        },
        include: { tags: { select: { id: true, value: true } } },
      });

      const hog = track();

      hog.capture({
        event: "store_created",
        distinctId: store.id,
      });

      reply.send({
        success: true,
        store,
      });
    },
  );

  // update store detail
  fastify.patch(
    "/api/v1/clients/:clientId/stores/:storeId",
    {
      preHandler: requirePermission(["store::update"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { storeId: id, clientId }: any = request.params;
      const { name, email, phone, address, manager, notes, tags }: any =
        request.body;

      const store = await prisma.store.update({
        where: { id, clientId },
        data: {
          name,
          email,
          phone,
          address,
          manager,
          clientId,
          notes: notes?.filter(Boolean),
          tags: {
            connect: tags?.map((tagId: string) => ({ id: tagId })),
          },
        },
        include: { tags: { select: { id: true, value: true } } },
      });

      const hog = track();

      hog.capture({
        event: "store_updated",
        distinctId: store.id,
      });

      reply.send({
        success: true,
        store,
      });
    },
  );

  // delete store from a client
  fastify.delete(
    "/api/v1/clients/:clientId/stores/:storeId",
    {
      preHandler: requirePermission(["store::delete"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { clientId, storeId }: any = request.params;

      await prisma.store.delete({
        where: { id: storeId, clientId },
      });

      const hog = track();

      hog.capture({
        event: "store_deleted",
        distinctId: storeId,
      });

      reply.send({
        success: true,
      });
    },
  );
}
