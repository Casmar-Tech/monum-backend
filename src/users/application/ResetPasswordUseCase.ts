import { MongoUserModel } from "../infrastructure/mongoModel/MongoUserModel.js";
import generateEmailHtml from "./utils/generateEmailHtml.js";
import { ApolloError } from "apollo-server-errors";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";
import bcrypt from "bcryptjs";

function compareLastRecoveryPasswordEmailSent(
  lastEmailTime: Date | undefined,
  currentTime: Date
) {
  if (lastEmailTime) {
    const timeDiff = (currentTime.getTime() - lastEmailTime.getTime()) / 1000;

    if (timeDiff < 60) {
      throw new ApolloError(
        "Cannot send another recovery email yet. Please wait.",
        "TOO_SOON_TO_SEND_ANOTHER_EMAIL"
      );
    }
  }
}

export default async function ResetPasswordUseCase(
  email: string,
  resend: boolean
): Promise<Boolean> {
  // See if the user exists with the email
  const user = await MongoUserModel.findOne({
    email,
  });
  if (!user || !user.email || !user.name) {
    return true;
  }

  const currentTime = new Date();

  if (resend) {
    const lastRecoveryPasswordEmailResent =
      user.lastRecoveryPasswordEmailResent;
    compareLastRecoveryPasswordEmailSent(
      lastRecoveryPasswordEmailResent,
      currentTime
    );
    user.lastRecoveryPasswordEmailResent = currentTime;
  } else {
    const lastRecoveryPasswordEmailSent = user.lastRecoveryPasswordEmailSent;
    compareLastRecoveryPasswordEmailSent(
      lastRecoveryPasswordEmailSent,
      currentTime
    );
    user.lastRecoveryPasswordEmailSent = currentTime;
  }

  user.recoveryPasswordCodeValidity = new Date(
    currentTime.getTime() + 10 * 60 * 1000
  );

  // Send reset password email using SES
  const sesClient = new SESClient({ region: "eu-west-1" });
  const toAddress = user.email;
  const fromAddress = "no-reply@monum.es";
  const randomCode = crypto.randomInt(100000, 999999).toString();
  const recoveryPasswordHashedCode = await bcrypt.hash(randomCode, 10);
  user.recoveryPasswordHashedCode = recoveryPasswordHashedCode;
  await user.save();
  const body = generateEmailHtml(user.name, randomCode, user.language);
  await sesClient.send(
    new SendEmailCommand({
      Destination: {
        CcAddresses: [],
        ToAddresses: [toAddress],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: body,
          },
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
  return true;
}
