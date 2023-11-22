import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import { ApolloError } from "apollo-server-errors";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import bcrypt from "bcryptjs";

interface ResetPasswordDTO {
  emailOrUsername: string;
}

export default async function ResetPasswordUseCase({
  emailOrUsername, 
}: ResetPasswordDTO): Promise<Boolean | null> {
  // See if the user exists with the email
  const user = await MongoUserModel.findOne({
    $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
  });
  if(!user){
    throw new ApolloError("User not found", "USER_NOT_FOUND");
  }
  
  // Send reset password email using SES
  const sesClient = new SESClient({ region: "eu-west-1" });
  const toAddress = user.email
  const fromAddress = "no-reply@monum.es"
  const newTempPassword = crypto.randomBytes(12).toString('hex');
  const newTempEncryptedPassword = await bcrypt.hash(newTempPassword, 10);
  user.hashedPassword = newTempEncryptedPassword;
  await MongoUserModel.findByIdAndUpdate(
    user.id,
    {
      hashedPassword: newTempEncryptedPassword,
      isTemporalPassword: true,
    },
    { new: true }
  );
  const body = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
      text-align: center;
    }

    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h1 {
      color: #333;
    }

    p {
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Your password reset request!</h1>
    <p>Here's your new password: <b>${newTempPassword}</b>.<br>
    You'll be prompted to change it on the next login!</p>
  </div>
</body>
</html>
  `
  try {
    await sesClient.send(new SendEmailCommand({
      Destination: {
        CcAddresses: [],
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: body,
          }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "MONUM: Password reset request",
        },
      },
      Source: fromAddress,
      ReplyToAddresses: [],
    })
    );
  } catch (e) {
    console.error(e);
    throw new ApolloError(
      `Failed to send email with error: ${e}`,
      `FAILED_TO_SEND_EMAIL`
    );
  }
  return true;
}
