import dotenv from 'dotenv';
dotenv.config();

import dns from 'node:dns';
dns.setDefaultResultOrder('ipv4first');

import { pool } from './src/server/config/db.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

async function migrate() {
  try {
    const sqlPath = path.join(process.cwd(), 'database', 'schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🚀 Menjalankan migrasi pembuatan tabel di Supabase...');
    await pool.query(sql);
    console.log('✅ Migrasi sukses! Semua tabel dan tipe data ENUM berhasil dibuat.');

    // Seed default admin account
    console.log('Menyiapkan akun default super_admin...');
    const hash = await bcrypt.hash('12345678', 10);
    
    // Check if admin exists first
    const adminCheck = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@bukukas.com']);
    if (adminCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (nama_lengkap, email, password_hash, role, is_verified)
        VALUES ('Super Admin', 'admin@bukukas.com', $1, 'super_admin', true)
      `, [hash]);
      console.log('✅ Akun Super Admin berhasil dibuat!');
      console.log('Email: admin@bukukas.com');
      console.log('Password: 12345678');
    } else {
      console.log('⚠️ Akun Super Admin sudah ada.');
    }

  } catch (err) {
    console.error('❌ Gagal menjalankan migrasi:', err);
  } finally {
    await pool.end();
  }
}

migrate();
