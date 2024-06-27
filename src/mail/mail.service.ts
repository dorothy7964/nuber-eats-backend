import { Inject, Injectable } from "@nestjs/common";
import * as FormData from "form-data";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { MailModuleOptions } from "./mail.interfaces";
import fetch from "node-fetch";

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    this.sendEmail("testing", "test")
      .then((data) => {
        console.log("Message sent");
        console.log("Message sent data", data);
      })
      .catch((error) => {
        console.log("Error sending email:", error.message);
      });
  }

  private async sendEmail(subject: string, content: string) {
    const form = new FormData();
    form.append("from", `Excited User <mailgun@${this.options.domain}>`);
    form.append("to", `${this.options.toEmail}`);
    form.append("subject", subject);
    form.append("text", content);

    console.log("📢 [mail.service.ts:29]", "sendEmail 함수실행");
    try {
      const response = await fetch(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString("base64")}`,
          },
          body: form,
        },
      );

      if (!response.ok) {
        const errorDetails = await response.json();
        throw new Error(`Failed to send email: ${errorDetails.message}`);
      }

      const result = await response.json();
      console.log(
        "📢 [mail.service.ts:35]",
        "Email sent successfully:",
        result,
      );
      return result;
    } catch (error) {
      console.error(
        "📢 [mail.service.ts:39]",
        "Error sending email:",
        error.message,
      );
      throw error;
    }
  }
}
