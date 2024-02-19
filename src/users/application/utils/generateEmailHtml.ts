export default function generateEmailHtml(
  username: string,
  verificationCode: string,
  language: string
) {
  const translations: any = {
    en_US: {
      title: "Verification code",
      greeting: "Dear",
      intro:
        "To continue with the password reset process for your Monum account, please use the following verification code:",
      codeValidity: "This code is valid for 10 minutes.",
      footer:
        "If you did not request a password reset, please ignore this email or contact support.",
      thankYou: "Thank you for using Monum!",
    },
    es_ES: {
      title: "Código de verificación",
      greeting: "Estimado/a",
      intro:
        "Para continuar con el proceso de restablecimiento de contraseña para su cuenta de Monum, por favor utilice el siguiente código de verificación:",
      codeValidity: "Este código es válido por 10 minutos.",
      footer:
        "Si no solicitó un restablecimiento de contraseña, ignore este correo electrónico o contacte al soporte.",
      thankYou: "¡Gracias por usar Monum!",
    },
    ca_ES: {
      title: "Codi de verificació",
      greeting: "Benvolgut/da",
      intro:
        "Per continuar amb el procés de restabliment de la seva contrasenya per al seu compte de Monum, si us plau utilitzi el següent codi de verificació:",
      codeValidity: "Aquest codi és vàlid durant 10 minuts.",
      footer:
        "Si no ha sol·licitat un restabliment de contrasenya, ignori aquest correu electrònic o contacti amb el suport.",
      thankYou: "Gràcies per utilitzar Monum!",
    },
    fr_FR: {
      title: "Code de vérification",
      greeting: "Cher(e)",
      intro:
        "Pour continuer le processus de réinitialisation de votre mot de passe pour votre compte Monum, veuillez utiliser le code de vérification suivant :",
      codeValidity: "Ce code est valide pendant 10 minutes.",
      footer:
        "Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet e-mail ou contacter le support.",
      thankYou: "Merci d'utiliser Monum !",
    },
  };

  const t = translations[language] || translations.en_US;

  return `
  <!DOCTYPE html>
  <html lang=${language}>
  <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Montserrat', Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ECF3EC;
    }
    .container {
      background-color: #ffffff;
      width: 100%;
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #3F713B;
      padding: 10px;
      border-top-left-radius: 8px;
      border-top-right-radius: 8px;
    }
    .logo {
      width: 100%;
      max-width: 180px;
      display: block;
      margin: 0 auto;
    }
    .content {
      padding: 20px;
      text-align: center;
      background-color: #F4FFF4;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 0.8em;
      background-color: #ECF3EC;
    }
    h1, p {
      margin: 0 0 10px;
      color: #3F713B;
    }
    p {
      font-size: 0.9em;
    }
  </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://monum-public-images.s3.eu-west-1.amazonaws.com/logo_white.png" alt="Monum Logo" class="logo">
      </div>
      <div class="content">
        <h1>${t.title}</h1>
        <p>${t.greeting} ${username},</p>
        <p>${t.intro}</p>
        <h2>${verificationCode}</h2>
        <p>${t.codeValidity}</p>
      </div>
      <div class="footer">
        <p>${t.footer}</p>
        <p>${t.thankYou}</p>
      </div>
    </div>
  </body>
  </html>
`;
}
