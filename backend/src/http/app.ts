import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { ZodError, z } from "zod";
import type { AquaConfig } from "../config.js";
import { constantTimeEqual } from "../crypto/hash.js";
import { AquaError } from "../domain/errors.js";
import type { Principal } from "../domain/types.js";
import type { SnapshotRepository } from "../persistence/snapshot-repository.js";
import type { AnchorService } from "../services/anchor-service.js";
import { SnapshotService } from "../services/snapshot-service.js";

const snapshotIdParams = z.object({ snapshotId: z.string().uuid() });
const idempotencyKeyHeader = z.string().trim().min(16).max(128).regex(/^[A-Za-z0-9._~-]+$/);
const createSnapshotBody = z.object({
  issuerId: z.string().min(3).max(128),
  attesterId: z.string().min(3).max(128),
  asset: z.object({ code: z.string().min(2).max(20), decimals: z.number().int().min(0).max(18) }),
  scope: z.object({
    liabilityDefinition: z.string().min(10).max(2_000),
    includedCategories: z.array(z.string().min(1).max(128)).max(32),
    excludedCategories: z.array(z.string().min(1).max(128)).max(32),
    limitations: z.string().min(20).max(4_000),
  }),
  cutoffAt: z.string().datetime({ offset: true }),
  expiresAt: z.string().datetime({ offset: true }),
  reserveTotalBaseUnits: z.string().regex(/^(0|[1-9]\d*)$/),
  reserveEvidenceReference: z.string().min(16).max(512),
  liabilities: z
    .array(z.object({ customerId: z.string().min(3).max(256), balanceBaseUnits: z.string().regex(/^[1-9]\d*$/) }))
    .min(1)
    .max(100_000),
});
const revokeBody = z.object({ reason: z.string().min(10).max(500) });
const reconcileBody = z.object({ abandonDeployment: z.boolean().optional().default(false) });
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().uuid().optional(),
});

export interface BuildAppOptions {
  config: AquaConfig;
  repository: SnapshotRepository;
  anchorService: AnchorService;
  logger?: boolean;
}

const requirePrincipal = (request: FastifyRequest, config: AquaConfig): Principal => {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AquaError("AUTHENTICATION_REQUIRED", "Bearer authentication is required", 401);
  }
  const supplied = authorization.slice("Bearer ".length);
  for (const [token, principal] of config.tokens) {
    if (constantTimeEqual(token, supplied)) return principal;
  }
  throw new AquaError("AUTHENTICATION_REQUIRED", "Authentication failed", 401);
};

const parse = <T>(schema: z.ZodType<T>, value: unknown): T => schema.parse(value);

export const buildApp = async ({ config, repository, anchorService, logger = false }: BuildAppOptions): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: logger
      ? {
          level: config.environment === "production" ? "info" : "warn",
          redact: ["req.headers.authorization", "req.headers.idempotency-key", "req.body.liabilities", "res.body.receipt"],
        }
      : false,
  });
  await app.register(cors, {
    origin: config.webOrigin ?? false,
    methods: ["GET", "POST"],
    allowedHeaders: ["authorization", "content-type", "idempotency-key"],
  });
  const snapshots = new SnapshotService(repository, anchorService, config);

  app.get("/health", async () => ({ status: "ok", service: "aqua-reserve-api", environment: config.environment }));
  app.get("/ready", async (_request, reply) => {
    try {
      await repository.healthCheck();
      return { status: "ready", service: "aqua-reserve-api", persistence: "available", anchorMode: config.anchorMode };
    } catch {
      return reply.code(503).send({ status: "not-ready", service: "aqua-reserve-api", persistence: "unavailable", anchorMode: config.anchorMode });
    }
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, {
    max: config.environment === "production" ? 120 : 1_000,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
  });

  app.post("/v1/snapshots", async (request, reply) => {
    const principal = requirePrincipal(request, config);
    if (!principal.roles.includes("ISSUER")) throw new AquaError("FORBIDDEN", "You are not authorised to perform this action", 403);
    const idempotencyKey = parse(idempotencyKeyHeader, request.headers["idempotency-key"]);
    const snapshot = await snapshots.create(principal, { ...parse(createSnapshotBody, request.body), idempotencyKey });
    return reply.code(201).send({ snapshot });
  });

  app.post("/v1/snapshots/:snapshotId/attest", async (request) => {
    const principal = requirePrincipal(request, config);
    const { snapshotId } = parse(snapshotIdParams, request.params);
    return { snapshot: await snapshots.attest(principal, snapshotId) };
  });

  app.post("/v1/snapshots/:snapshotId/revoke", async (request) => {
    const principal = requirePrincipal(request, config);
    const { snapshotId } = parse(snapshotIdParams, request.params);
    const { reason } = parse(revokeBody, request.body);
    return { snapshot: await snapshots.revoke(principal, snapshotId, reason) };
  });

  app.get("/v1/issuer/snapshots/by-idempotency-key", async (request) => {
    const principal = requirePrincipal(request, config);
    const idempotencyKey = parse(idempotencyKeyHeader, request.headers["idempotency-key"]);
    return { snapshot: await snapshots.findByIdempotencyKey(principal, idempotencyKey) };
  });

  app.get("/v1/public/snapshots", async (request) => {
    const { limit, cursor } = parse(listQuery, request.query);
    return snapshots.listPublic(limit ?? 20, cursor ?? null);
  });

  app.get("/v1/issuer/snapshots", async (request) => {
    const principal = requirePrincipal(request, config);
    const { limit, cursor } = parse(listQuery, request.query);
    return snapshots.listForIssuer(principal, limit ?? 20, cursor ?? null);
  });

  app.get("/v1/attester/snapshots", async (request) => {
    const principal = requirePrincipal(request, config);
    const { limit, cursor } = parse(listQuery, request.query);
    return snapshots.listForAttester(principal, limit ?? 20, cursor ?? null);
  });

  app.post("/v1/snapshots/:snapshotId/reconcile", async (request) => {
    const principal = requirePrincipal(request, config);
    const { snapshotId } = parse(snapshotIdParams, request.params);
    const { abandonDeployment } = parse(reconcileBody, request.body ?? {});
    return { snapshot: await snapshots.reconcile(principal, snapshotId, abandonDeployment ?? false) };
  });

  app.get("/v1/public/snapshots/:snapshotId", async (request) => {
    const { snapshotId } = parse(snapshotIdParams, request.params);
    return { snapshot: await snapshots.publicSnapshot(snapshotId) };
  });

  app.get("/v1/customer/snapshots/:snapshotId/verification", async (request) => {
    const principal = requirePrincipal(request, config);
    const { snapshotId } = parse(snapshotIdParams, request.params);
    return { verification: await snapshots.verifyCustomer(principal, snapshotId) };
  });

  app.get("/v1/snapshots/:snapshotId/events", async (request) => {
    const principal = requirePrincipal(request, config);
    const { snapshotId } = parse(snapshotIdParams, request.params);
    return { events: await snapshots.events(principal, snapshotId) };
  });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({ error: { code: "VALIDATION_ERROR", message: "Request validation failed" } });
    }
    if (error instanceof AquaError) {
      return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }
    app.log.error(error);
    return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
  });

  return app;
};
