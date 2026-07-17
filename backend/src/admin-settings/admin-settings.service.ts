// budget: 400 lines
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FieldDefinition {
  key: string;
  label: string;
  placeholder: string;
  // Environment variables (injected from infra-secrets) that satisfy this field.
  envKeys: string[];
}

interface SettingDefinition {
  key: string;
  label: string;
  fields: FieldDefinition[];
}

// Public shape mirrors the frontend AdminSetting model.
export interface AdminSettingView {
  key: string;
  label: string;
  configured: boolean;
  maskedValue: string;
  fields: { key: string; label: string; placeholder: string }[];
}

// Backing-service definitions. Connection details arrive as environment
// variables from the single-namespace `infra-secrets`; admins may also store
// overrides which persist in the AppSetting table.
const DEFINITIONS: SettingDefinition[] = [
  {
    key: 'postgresql',
    label: 'PostgreSQL Database',
    fields: [
      {
        key: 'DATABASE_URL',
        label: 'Connection URL',
        placeholder: 'postgresql://user:pass@host:5432/db',
        envKeys: ['DATABASE_URL'],
      },
    ],
  },
  {
    key: 'minio',
    label: 'MinIO Object Storage',
    fields: [
      {
        key: 'MINIO_ENDPOINT',
        label: 'Endpoint',
        placeholder: 'https://minio.example.com',
        envKeys: ['MINIO_ENDPOINT', 'S3_ENDPOINT'],
      },
      {
        key: 'MINIO_ACCESS_KEY',
        label: 'Access key',
        placeholder: 'AKIA…',
        envKeys: ['MINIO_ACCESS_KEY', 'S3_ACCESS_KEY'],
      },
      {
        key: 'MINIO_SECRET_KEY',
        label: 'Secret key',
        placeholder: '••••••••',
        envKeys: ['MINIO_SECRET_KEY', 'S3_SECRET_KEY'],
      },
    ],
  },
];

@Injectable()
export class AdminSettingsService {
  private readonly logger = new Logger('AdminSettingsService');

  constructor(private prisma: PrismaService) {}

  async list(): Promise<AdminSettingView[]> {
    const overrides = await this.loadOverrides();
    return DEFINITIONS.map((def) => this.toView(def, overrides));
  }

  async save(
    key: string,
    values: Record<string, string> = {},
  ): Promise<AdminSettingView> {
    const def = DEFINITIONS.find((d) => d.key === key);
    if (!def) throw new NotFoundException('Unknown setting');

    const overrides = await this.loadOverrides();
    for (const field of def.fields) {
      const value = values[field.key]?.trim();
      if (!value) continue;
      await this.prisma.appSetting.upsert({
        where: { key: field.key },
        update: { value },
        create: { key: field.key, value },
      });
      overrides.set(field.key, value);
    }
    return this.toView(def, overrides);
  }

  private toView(
    def: SettingDefinition,
    overrides: Map<string, string>,
  ): AdminSettingView {
    const resolved = def.fields.map((f) => this.resolve(f, overrides));
    const configured = resolved.every((v) => v.length > 0);
    return {
      key: def.key,
      label: def.label,
      configured,
      maskedValue: configured ? '•••• configured' : '',
      fields: def.fields.map((f) => ({
        key: f.key,
        label: f.label,
        placeholder: f.placeholder,
      })),
    };
  }

  private resolve(field: FieldDefinition, overrides: Map<string, string>): string {
    const override = overrides.get(field.key);
    if (override) return override;
    for (const envKey of field.envKeys) {
      const val = process.env[envKey];
      if (val) return val;
    }
    return '';
  }

  private async loadOverrides(): Promise<Map<string, string>> {
    try {
      const rows = await this.prisma.appSetting.findMany();
      return new Map(rows.map((r) => [r.key, r.value]));
    } catch (err) {
      // Keep the settings page functional even if the overrides table is
      // unavailable — fall back to environment-derived status only.
      this.logger.warn(`AppSetting lookup failed, using env only: ${String(err)}`);
      return new Map();
    }
  }
}
