import { RuntimeRulesType, createCompiledPrompt } from './runtimeRules';
import { writeFile, readFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { prisma } from '~/db.server';

export interface PromptVersion {
  id: string;
  tenant: string;
  compiledPrompt: string;
  runtimeRules: RuntimeRulesType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromptVersionData {
  tenant: string;
  runtimeRules: RuntimeRulesType;
  isActive?: boolean;
}

/**
 * Storage configuration - use SQLite by default, fallback to JSON files
 */
const STORAGE_TYPE = process.env.PROMPT_VERSION_STORAGE || 'sqlite'; // 'sqlite' or 'json'

/**
 * Creates a new prompt version in storage
 */
export async function createPromptVersion(data: CreatePromptVersionData): Promise<PromptVersion> {
  const compiledPrompt = createCompiledPrompt(data.runtimeRules);
  const runtimeRulesJson = JSON.stringify(data.runtimeRules);

  if (STORAGE_TYPE === 'json') {
    return await createPromptVersionInJson(data, compiledPrompt, runtimeRulesJson);
  } else {
    return await createPromptVersionInSqlite(data, compiledPrompt, runtimeRulesJson);
  }
}

/**
 * Gets all prompt versions for a tenant
 */
export async function getPromptVersions(tenant: string): Promise<PromptVersion[]> {
  if (STORAGE_TYPE === 'json') {
    return await getPromptVersionsFromJson(tenant);
  } else {
    return await getPromptVersionsFromSqlite(tenant);
  }
}

/**
 * Gets the active prompt version for a tenant
 */
export async function getActivePromptVersion(tenant: string): Promise<PromptVersion | null> {
  if (STORAGE_TYPE === 'json') {
    return await getActivePromptVersionFromJson(tenant);
  } else {
    return await getActivePromptVersionFromSqlite(tenant);
  }
}

/**
 * Activates a specific prompt version (deactivates others)
 */
export async function activatePromptVersion(tenant: string, versionId: string): Promise<PromptVersion | null> {
  if (STORAGE_TYPE === 'json') {
    return await activatePromptVersionInJson(tenant, versionId);
  } else {
    return await activatePromptVersionInSqlite(tenant, versionId);
  }
}

/**
 * Deletes a specific prompt version (prevents deleting active version)
 */
export async function deletePromptVersion(tenant: string, versionId: string): Promise<boolean> {
  if (STORAGE_TYPE === 'json') {
    return await deletePromptVersionFromJson(tenant, versionId);
  } else {
    return await deletePromptVersionFromSqlite(tenant, versionId);
  }
}

/**
 * SQLite implementation
 */
async function createPromptVersionInSqlite(
  data: CreatePromptVersionData,
  compiledPrompt: string,
  runtimeRulesJson: string
): Promise<PromptVersion> {
  const result = await prisma.promptVersion.create({
    data: {
      tenant: data.tenant,
      compiledPrompt,
      runtimeRules: runtimeRulesJson,
      isActive: data.isActive || false,
    },
  });

  return {
    id: result.id,
    tenant: result.tenant,
    compiledPrompt: result.compiledPrompt,
    runtimeRules: JSON.parse(result.runtimeRules),
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

async function getPromptVersionsFromSqlite(tenant: string): Promise<PromptVersion[]> {
  const results = await prisma.promptVersion.findMany({
    where: { tenant },
    orderBy: { createdAt: 'desc' },
  });

  return results.map(result => ({
    id: result.id,
    tenant: result.tenant,
    compiledPrompt: result.compiledPrompt,
    runtimeRules: JSON.parse(result.runtimeRules),
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }));
}

async function getActivePromptVersionFromSqlite(tenant: string): Promise<PromptVersion | null> {
  const result = await prisma.promptVersion.findFirst({
    where: { tenant, isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!result) return null;

  return {
    id: result.id,
    tenant: result.tenant,
    compiledPrompt: result.compiledPrompt,
    runtimeRules: JSON.parse(result.runtimeRules),
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

async function activatePromptVersionInSqlite(tenant: string, versionId: string): Promise<PromptVersion | null> {
  // First, deactivate all versions for this tenant
  await prisma.promptVersion.updateMany({
    where: { tenant },
    data: { isActive: false },
  });

  // Then activate the specific version
  const result = await prisma.promptVersion.update({
    where: { id: versionId, tenant },
    data: { isActive: true },
  });

  return {
    id: result.id,
    tenant: result.tenant,
    compiledPrompt: result.compiledPrompt,
    runtimeRules: JSON.parse(result.runtimeRules),
    isActive: result.isActive,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  };
}

async function deletePromptVersionFromSqlite(tenant: string, versionId: string): Promise<boolean> {
  // Check if this version is active
  const version = await prisma.promptVersion.findUnique({
    where: { id: versionId },
  });

  if (!version) {
    throw new Error('Version not found');
  }

  if (version.tenant !== tenant) {
    throw new Error('Unauthorized');
  }

  if (version.isActive) {
    throw new Error('Cannot delete the active version');
  }

  // Delete the version
  await prisma.promptVersion.delete({
    where: { id: versionId },
  });

  return true;
}

/**
 * JSON file implementation (fallback)
 */
async function createPromptVersionInJson(
  data: CreatePromptVersionData,
  compiledPrompt: string,
  runtimeRulesJson: string
): Promise<PromptVersion> {
  const versionsDir = join(process.cwd(), 'data', 'prompt-versions');
  await mkdir(versionsDir, { recursive: true });

  const versionId = generateId();
  const version: PromptVersion = {
    id: versionId,
    tenant: data.tenant,
    compiledPrompt,
    runtimeRules: JSON.parse(runtimeRulesJson),
    isActive: data.isActive || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const filePath = join(versionsDir, `${data.tenant}-${versionId}.json`);
  await writeFile(filePath, JSON.stringify(version, null, 2));

  return version;
}

async function getPromptVersionsFromJson(tenant: string): Promise<PromptVersion[]> {
  const versionsDir = join(process.cwd(), 'data', 'prompt-versions');

  try {
    const files = await readdir(versionsDir);
    const tenantFiles = files.filter(file => file.startsWith(`${tenant}-`));

    const versions: PromptVersion[] = [];

    for (const file of tenantFiles) {
      const filePath = join(versionsDir, file);
      const content = await readFile(filePath, 'utf-8');
      const version = JSON.parse(content) as PromptVersion;
      versions.push(version);
    }

    return versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    // Directory doesn't exist or no files yet
    return [];
  }
}

async function getActivePromptVersionFromJson(tenant: string): Promise<PromptVersion | null> {
  const versions = await getPromptVersionsFromJson(tenant);
  return versions.find(v => v.isActive) || null;
}

async function activatePromptVersionInJson(tenant: string, versionId: string): Promise<PromptVersion | null> {
  const versions = await getPromptVersionsFromJson(tenant);

  // Deactivate all versions
  for (const version of versions) {
    version.isActive = false;
    version.updatedAt = new Date();
  }

  // Activate the specific version
  const targetVersion = versions.find(v => v.id === versionId);
  if (targetVersion) {
    targetVersion.isActive = true;
    targetVersion.updatedAt = new Date();

    // Save all versions back to files
    const versionsDir = join(process.cwd(), 'data', 'prompt-versions');
    for (const version of versions) {
      const filePath = join(versionsDir, `${version.tenant}-${version.id}.json`);
      await writeFile(filePath, JSON.stringify(version, null, 2));
    }

    return targetVersion;
  }

  return null;
}

async function deletePromptVersionFromJson(tenant: string, versionId: string): Promise<boolean> {
  const versions = await getPromptVersionsFromJson(tenant);
  const version = versions.find(v => v.id === versionId);

  if (!version) {
    throw new Error('Version not found');
  }

  if (version.isActive) {
    throw new Error('Cannot delete the active version');
  }

  // Delete the file
  const versionsDir = join(process.cwd(), 'data', 'prompt-versions');
  const filePath = join(versionsDir, `${tenant}-${versionId}.json`);
  const { unlink } = await import('fs/promises');
  await unlink(filePath);

  return true;
}

/**
 * Generate a unique ID for prompt versions
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Import readdir for JSON file operations (already imported above)
 */
