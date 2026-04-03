import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface CodigoAcceso {
  codigo: string;
  clase: string;
  expiraAt: string;
}

export async function enviarCodigosAcceso(
  email: string,
  codigos: CodigoAcceso[],
  tieneMembresia: boolean,
  planMembresia?: string,
  expiraMembresia?: string
) {
  const listaCodeigos = codigos
    .map(
      (c) =>
        `<tr>
          <td style="padding:8px 12px;border:1px solid #e5e5e5;font-family:monospace;font-size:18px;font-weight:bold;color:#722F37;letter-spacing:2px">${c.codigo}</td>
          <td style="padding:8px 12px;border:1px solid #e5e5e5">${c.clase}</td>
          <td style="padding:8px 12px;border:1px solid #e5e5e5">${new Date(c.expiraAt).toLocaleDateString("es")}</td>
        </tr>`
    )
    .join("");

  const membresiaHtml = tieneMembresia
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px">
        <strong style="color:#166534">Membresia ${planMembresia} activa</strong>
        <p style="margin:4px 0 0;color:#15803d;font-size:13px">Vence: ${expiraMembresia ? new Date(expiraMembresia).toLocaleDateString("es") : "N/A"}</p>
      </div>`
    : "";

  const html = `
    <div style="max-width:500px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <div style="text-align:center;padding:20px 0;border-bottom:2px solid #722F37">
        <h1 style="margin:0;color:#722F37;font-size:22px">Deby Chantell Coach Academy</h1>
      </div>
      <div style="padding:24px 16px">
        <h2 style="margin:0 0 8px;font-size:18px">Tus codigos de acceso</h2>
        <p style="color:#666;font-size:14px;margin:0 0 20px">Aqui estan tus codigos activos. Usalos en la seccion "Ingresar" de la plataforma.</p>
        ${membresiaHtml}
        ${
          codigos.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
                <thead>
                  <tr style="background:#f9f9f9">
                    <th style="padding:8px 12px;border:1px solid #e5e5e5;text-align:left">Codigo</th>
                    <th style="padding:8px 12px;border:1px solid #e5e5e5;text-align:left">Curso</th>
                    <th style="padding:8px 12px;border:1px solid #e5e5e5;text-align:left">Vence</th>
                  </tr>
                </thead>
                <tbody>${listaCodeigos}</tbody>
              </table>`
            : `<p style="color:#999;font-size:14px">No tienes codigos de cursos individuales activos.</p>`
        }
        <p style="color:#999;font-size:12px;margin-top:24px">Si no solicitaste este correo, puedes ignorarlo.</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "Deby Chantell Academy <onboarding@resend.dev>",
    to: email,
    subject: "Tus codigos de acceso - Deby Chantell Coach Academy",
    html,
  });
}
