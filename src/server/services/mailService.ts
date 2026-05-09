import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.warn('⚠️ GMAIL_USER atau GMAIL_APP_PASSWORD belum diatur. Fitur email tidak akan berfungsi.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
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
    from: `"BukuKas Support" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Kode Verifikasi Lupa Password - BukuKas',
    html: `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
        <h2 style="color: #2563eb;">Lupa Password?</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk mereset password akun BukuKas Anda. Silakan gunakan kode verifikasi di bawah ini untuk melanjutkan:</p>
        <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1e293b; border-radius: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>Kode ini akan kadaluwarsa dalam <b>15 menit</b>.</p>
        <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">Tim BukuKas SaaS</p>
      </div>
    `,
  };

  await mailTransporter.sendMail(mailOptions);
};
