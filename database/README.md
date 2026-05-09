# Arsitektur Database Multi-Tenant: BukuKas SaaS

File `schema.sql` berisikan skema Data Definition Language (DDL) PostgreSQL yang dirancang khusus untuk memenuhi arsitektur multi-tenant aplikasi SaaS Pembukuan Keuangan. Berikut adalah penjelasan mengenai alur logika dan optimasi dari rancangan database ini.

## Isolasi Data Multi-Tenant
Setiap tabel yang mendatung data yang spesifik dengan pengguna (`kategori_transaksi`, `transaksi`) diwajibkan memiliki kolom `user_id`. Hal ini memungkinkan kita untuk melakukan _Row-Level Isolation_ di level aplikasi (melalui Express.js Controller nantinya) maupun dengan _Row-Level Security (RLS)_ spesifik database.

Dalam setiap operasi DML (Data Manipulation Language) seperti `SELECT`, `UPDATE`, atau `DELETE`, `WHERE user_id = ?` wajib selalu disertakan sehingga tidak ada antrian transaksi yang dapat terekspos lintas _tenant_.

## Relasi dan Foreign Keys Constraint
- **`fk_transaksi_user` & `fk_kategori_user` (ON DELETE CASCADE):**
  Jika suatu saat akun pengguna dihapus (misalnya penutupan akun permanen), semua kategori maupun data transaksinya akan otomatis terhapus tanpa ada data yatim piatu (orphan data) yang membebani _storage_ server.
- **`fk_transaksi_kategori` (ON DELETE RESTRICT):**
  User tidak diizinkan untuk menghapus secara serampangan `kategori_transaksi` apabila _record_ pada tabel `transaksi` masih mengandalkan ID kategori tersebut. Hal ini menjaga integritas pelaporan, agar data transaksi lama tidak rusak gara-gara kategorinya hilang.

## Optimasi Indexing & T-SQL/Query Reporting
Laporan keuangan bulanan mensyaratkan agregasi matematika (`SUM`, `COUNT`) di periode tanggal spesifik per user. Terdapat tiga pengelompokan index pada tabel `transaksi`:
1. `idx_transaksi_userid_tanggal`: **(Composite Index)** Merupakan _sweet-spot_ indexing untuk Reporting. Saat aplikasi menjalankan query semacam `WHERE user_id = $1 AND tanggal >= $2 AND tanggal <= $3`, PostgresSQL bisa langsung menelusuri index _composite_ secara efisien, tidak perlu melakukan _table scan_ dari jutaan baris data _tenant_ lain.
2. Index tipe data UUID digunakan ketimbang Auto Increment (Integer) dengan harapan aplikasi SaaS ini bersifat lebih aman dari pencacahan serangan URL (ID-Guessing), dan juga mempermudah _scaling database_ secara horizontal di masa depan.
3. Menambahkan pengecekan constraint matematika di database `CHECK (nominal > 0)` untuk memastikan tidak ada angka negatif atau nol yang terselip karena kecacatan/bug pada aplikasi Node.js.
