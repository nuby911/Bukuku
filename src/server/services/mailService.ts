import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ GMAIL_USER atau GMAIL_APP_PASSWORD belum diatur. Fitur email tidak akan berfungsi.');
    }
    return null;
  }

  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // port 587 uses STARTTLS
    auth: { user, pass },
  });

  return transporter;
};

export const sendResetCodeEmail = async (email: string, code: string) => {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    throw new Error('Layanan email belum dikonfigurasi oleh admin.');
  }

  const mailOptions = {
    from: `"aturlah.id Support" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Kode Verifikasi Lupa Password - aturlah.id',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #2563eb;">Lupa Password?</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun aturlah.id Anda. Silakan gunakan kode verifikasi di bawah ini untuk melanjutkan:</p>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>Kode ini akan kadaluwarsa dalam <b>15 menit</b>.</p>
        <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Tim aturlah.id</p>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
  } catch (err: any) {
    console.error('⚠️ Gagal mengirim email SMTP:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n==================================================');
      console.log(`[DEV MODE - SMTP TIMEOUT / BLOCKED]`);
      console.log(`Penerima: ${email}`);
      console.log(`Kode OTP Reset Password Anda: ${code}`);
      console.log('==================================================\n');
      return;
    }
    throw err;
  }
};

export const sendVerificationEmail = async (email: string, token: string, baseUrl: string) => {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    throw new Error('Layanan email belum dikonfigurasi oleh admin.');
  }

  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"aturlah.id Support" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Verifikasi Email Anda - aturlah.id',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #2563eb; text-align: center;">Selamat Datang di aturlah.id!</h2>
        <p>Halo,</p>
        <p>Terima kasih telah mendaftar di aturlah.id. Untuk mulai menggunakan aplikasi, silakan verifikasi alamat email Anda dengan menekan tombol di bawah ini:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verifikasi Email Saya</a>
        </div>
        <p>Atau salin link berikut ke browser Anda:</p>
        <p style="font-size: 12px; color: #64748b; word-break: break-all;">${verificationUrl}</p>
        <p>Link ini akan kadaluwarsa dalam <b>24 jam</b>.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Tim aturlah.id</p>
      </div>
    `,
  };

  try {
    await mailTransporter.sendMail(mailOptions);
  } catch (err: any) {
    console.error('⚠️ Gagal mengirim email SMTP:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n==================================================');
      console.log(`[DEV MODE - SMTP TIMEOUT / BLOCKED]`);
      console.log(`Penerima: ${email}`);
      console.log(`Link Verifikasi Akun Anda: ${verificationUrl}`);
      console.log('==================================================\n');
      return;
    }
    throw err;
  }
};
