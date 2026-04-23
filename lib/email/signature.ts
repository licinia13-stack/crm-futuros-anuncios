const BASE = 'https://crm-futurosanuncios.vercel.app';
const LOGO_URL = `${BASE}/logo-futuros-anuncios.png`;
const ICON = (name: string) => `${BASE}/icons/${name}`;

export const EMAIL_SIGNATURE_HTML = `
<link href="https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" rel="stylesheet">
<style>@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');</style>
<table cellpadding="0" cellspacing="0" border="0" width="520" bgcolor="#0d0a1e"
  style="width:520px;background-color:#0d0a1e;background:radial-gradient(ellipse at 80% 35%,rgba(124,58,237,.20) 0%,transparent 60%),radial-gradient(ellipse at 10% 85%,rgba(27,79,216,.16) 0%,transparent 55%),radial-gradient(ellipse at 50% 100%,rgba(219,39,119,.08) 0%,transparent 50%),linear-gradient(150deg,#07091c 0%,#0d0a1e 50%,#130820 100%);border-radius:16px;overflow:hidden;font-family:'Outfit',Helvetica,Arial,sans-serif;box-shadow:0 24px 80px rgba(0,0,0,.7),0 0 0 1px rgba(124,58,237,.15);">
  <tr>
    <td height="4" bgcolor="#7C3AED" style="height:4px;font-size:0;line-height:0;background:linear-gradient(90deg,#1B4FD8 0%,#7C3AED 50%,#EC4899 100%);">&nbsp;</td>
  </tr>
  <tr>
    <td bgcolor="#0d0a1e" style="padding:26px 30px 16px 30px;background-color:#0d0a1e;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="148" valign="middle" style="padding-right:20px;">
            <table cellpadding="0" cellspacing="0" border="0" width="148">
              <tr>
                <td bgcolor="#7C3AED" style="background:linear-gradient(135deg,#1B4FD8,#7C3AED,#EC4899);border-radius:14px;padding:2px;line-height:0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td bgcolor="#07091c" style="background:#07091c;border-radius:12px;padding:6px;line-height:0;">
                        <img src="${LOGO_URL}" alt="Futuros An&#250;ncios" width="132" style="display:block;width:132px;border-radius:8px;">
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
          <td valign="middle">
            <p style="margin:0;padding:0;font-family:'Great Vibes',cursive;font-size:36px;font-weight:400;line-height:1.15;background:linear-gradient(90deg,#93c5fd 0%,#c4b5fd 55%,#f9a8d4 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;color:#c4b5fd;">Lic&#237;nia Sim&#245;es</p>
            <p style="margin:7px 0 0 0;padding:0;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:10px;font-weight:600;letter-spacing:2.4px;text-transform:uppercase;color:#8b5cf6;">Gestora de Marketing Digital</p>
            <p style="margin:4px 0 0 0;padding:0;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:11px;font-weight:300;color:#8892a4;letter-spacing:.3px;">Ag&#234;ncia Futuros An&#250;ncios</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#0d0a1e" style="padding:0 30px 18px 30px;background-color:#0d0a1e;">
      <p style="margin:0;padding:7px 0 7px 12px;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:10.5px;font-weight:300;font-style:italic;color:#7a8599;letter-spacing:.7px;border-left:2px solid #7C3AED;">Tr&#225;fego pago e presen&#231;a digital para a Constru&#231;&#227;o</p>
    </td>
  </tr>
  <tr>
    <td bgcolor="#0d0a1e" style="padding:0 30px 18px 30px;background-color:#0d0a1e;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td height="1" bgcolor="#7C3AED" style="height:1px;font-size:0;line-height:0;background:linear-gradient(90deg,rgba(27,79,216,0) 0%,#1B4FD8 12%,#7C3AED 50%,#EC4899 88%,rgba(236,72,153,0) 100%);">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#0d0a1e" style="padding:0 30px 16px 30px;background-color:#0d0a1e;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding-right:22px;white-space:nowrap;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:6px;vertical-align:middle;font-size:15px;line-height:1;color:#60a5fa;">&#9990;</td>
              <td style="vertical-align:middle;"><a href="tel:+351916493687" style="font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;color:#94a3b8;text-decoration:none;white-space:nowrap;">916 493 687</a></td>
            </tr></table>
          </td>
          <td style="padding-right:22px;white-space:nowrap;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:6px;vertical-align:middle;font-size:15px;line-height:1;color:#f472b6;">&#9993;</td>
              <td style="vertical-align:middle;"><a href="mailto:geral@futurosanuncios.com" style="font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;color:#94a3b8;text-decoration:none;white-space:nowrap;">geral@futurosanuncios.com</a></td>
            </tr></table>
          </td>
          <td style="white-space:nowrap;vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" border="0"><tr>
              <td style="padding-right:6px;vertical-align:middle;font-size:15px;line-height:1;color:#a78bfa;">&#8853;</td>
              <td style="vertical-align:middle;"><a href="https://futurosanuncios.com" style="font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:12px;font-weight:400;color:#94a3b8;text-decoration:none;white-space:nowrap;">futurosanuncios.com</a></td>
            </tr></table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td bgcolor="#0d0a1e" style="padding:0 30px 26px 30px;background-color:#0d0a1e;">
      <table cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:8px;">
          <a href="https://wa.me/351916493687"
            style="display:inline-block;width:34px;height:34px;background:#25D366;border-radius:8px;text-decoration:none;text-align:center;line-height:34px;">
            <img src="${ICON('social-whatsapp.png')}" width="20" height="20" alt="W"
              style="display:inline-block;vertical-align:middle;width:20px;height:20px;border:0;">
          </a>
        </td>
        <td style="padding-right:8px;">
          <a href="https://instagram.com/futurosanuncios"
            style="display:inline-block;width:34px;height:34px;background:#C13584;border-radius:8px;text-decoration:none;text-align:center;line-height:34px;">
            <img src="${ICON('social-instagram.png')}" width="20" height="20" alt="ig"
              style="display:inline-block;vertical-align:middle;width:20px;height:20px;border:0;">
          </a>
        </td>
        <td style="padding-right:8px;">
          <a href="https://facebook.com/futurosanuncios"
            style="display:inline-block;width:34px;height:34px;background:#1877F2;border-radius:8px;text-decoration:none;text-align:center;line-height:34px;">
            <img src="${ICON('social-facebook.png')}" width="20" height="20" alt="f"
              style="display:inline-block;vertical-align:middle;width:20px;height:20px;border:0;">
          </a>
        </td>
        <td>
          <a href="https://www.linkedin.com/company/futuros-anuncios"
            style="display:inline-block;width:34px;height:34px;background:#0A66C2;border-radius:8px;text-decoration:none;text-align:center;line-height:34px;">
            <img src="${ICON('social-linkedin.png')}" width="20" height="20" alt="in"
              style="display:inline-block;vertical-align:middle;width:20px;height:20px;border:0;">
          </a>
        </td>
      </tr></table>
    </td>
  </tr>
  <tr>
    <td height="4" bgcolor="#7C3AED" style="height:4px;font-size:0;line-height:0;background:linear-gradient(90deg,#EC4899 0%,#7C3AED 50%,#1B4FD8 100%);">&nbsp;</td>
  </tr>
</table>
`;
