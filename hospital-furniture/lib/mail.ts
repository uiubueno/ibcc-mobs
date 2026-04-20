import { Resend } from 'resend';

// Adicione a sua chave no arquivo .env como RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const data = await resend.emails.send({
      from: 'Hotelaria IBCC <onboarding@resend.dev>', // Quando você tiver domínio próprio, troca aqui
      to,
      subject,
      html,
    });
    return data;
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    return null;
  }
}