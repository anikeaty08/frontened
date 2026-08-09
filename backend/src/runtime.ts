import { loadConfig, type AquaConfig } from "./config.js";
import { DevelopmentAnchorService, MidnightDirectAnchorService, NodeLifecycleRunner, type AnchorService } from "./services/anchor-service.js";
import { InMemorySnapshotRepository, type SnapshotRepository } from "./persistence/snapshot-repository.js";
import { PostgresSnapshotRepository } from "./persistence/postgres-snapshot-repository.js";
import { buildApp } from "./http/app.js";

export interface Runtime {
  app: Awaited<ReturnType<typeof buildApp>>;
  close(): Promise<void>;
}

export const createRuntime = async (config = loadConfig()): Promise<Runtime> => {
  let repository: SnapshotRepository = new InMemorySnapshotRepository();
  let closeRepository = async (): Promise<void> => {};
  if (config.databaseUrl) {
    const postgres = new PostgresSnapshotRepository(config.databaseUrl);
    await postgres.migrate();
    repository = postgres;
    closeRepository = () => postgres.close();
  } else if (config.rdsIam) {
    const postgres = PostgresSnapshotRepository.fromRdsIam(config.rdsIam, config.environment === "production");
    await postgres.migrate();
    repository = postgres;
    closeRepository = () => postgres.close();
  } else if (config.environment === "production") {
    throw new Error("DATABASE_URL or AQUA_RDS_IAM_AUTH is required in production");
  }

  let anchorService: AnchorService = new DevelopmentAnchorService();
  if (config.anchorMode === "midnight-preprod") {
    anchorService = new MidnightDirectAnchorService(new NodeLifecycleRunner(config.midnightWorkerDirectory!));
  }

  const app = await buildApp({ config, repository, anchorService, logger: true });
  return {
    app,
    async close(): Promise<void> {
      await app.close();
      await closeRepository();
    },
  };
};
