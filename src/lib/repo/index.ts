import { MemoryRepository } from './memory';
import { PostgresRepository } from './postgres';
import type { Repository } from './types';

const globalForRepo = globalThis as unknown as { __floresRepo?: Repository };

/** Selecciona PostgreSQL si hay DATABASE_URL; si no, usa memoria (demo). */
export function getRepo(): Repository {
  if (!globalForRepo.__floresRepo) {
    const url = process.env.DATABASE_URL;
    globalForRepo.__floresRepo = url
      ? new PostgresRepository(url, process.env.DATABASE_CA)
      : new MemoryRepository({ seed: true });
  }
  return globalForRepo.__floresRepo;
}

/** Solo para pruebas: inyecta un repositorio aislado. */
export function setRepo(repo: Repository | undefined): void {
  globalForRepo.__floresRepo = repo;
}
