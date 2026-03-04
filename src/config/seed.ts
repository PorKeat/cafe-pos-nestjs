import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function seed() {
  await AppDataSource.initialize();
  const hashed = await bcrypt.hash('admin123', 10);
  await AppDataSource.query(`
    INSERT INTO users (id, email, name, password, role, "isActive", "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'admin@cafe.com', 'Admin', '${hashed}', 'admin', true, NOW(), NOW())
  `);
  console.log('✅ Admin created: admin@cafe.com / admin123');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});