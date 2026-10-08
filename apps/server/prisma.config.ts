import { defineConfig } from 'prisma/config';
// CLI fallback chỉ cho môi trường local; không lưu hoặc sửa secrets.
process.env.DATABASE_URL ??= 'postgresql://postgres@127.0.0.1:54329/mmorpg_dev';
export default defineConfig({ schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations' } });
