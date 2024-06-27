import { Inject, Injectable } from "@nestjs/common";
import * as FormData from "form-data";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { EmailVar, MailModuleOptions } from "./mail.interfaces";
import fetch from "node-fetch";

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {
    this.sendVerificationEmail("test@gmail.com", "codo-test")
      .then((data) => {
        console.log("Message sent");
        console.log("Message sent data", data);
      })
      .catch((error) => {
        console.log("Error sending email:", error.message);
      });
  }

  private async sendEmail(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append("from", `Nubber Eats <mailgun@${this.options.domain}>`);
    form.append("to", `${this.options.toEmail}`);
    form.append("subject", subject);
    form.append("template", template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));

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
  private async sendEmailDemo(
    subject: string,
    template: string,
    emailVars: EmailVar[],
  ) {
    const form = new FormData();
    form.append("from", `Nubber Eats <mailgun@${this.options.domain}>`);
    form.append("to", `${this.options.toEmail}`);
    form.append("subject", subject);
    form.append("template", template);
    emailVars.forEach((eVar) => form.append(`v:${eVar.key}`, eVar.value));
    console.log("📢 [sendEmailDemo-form: ]", form);
  }

  async sendVerificationEmail(email: string, code: string) {
    /** mailgun 비활성화 계정 이슈
     * 메일건 계정이 비활성화 계정으로 되어있어 sendEmail함수가 작동하지 않음
     * 임시로 sendEmailDemo 함수로 보내주자
     */
    this.sendEmailDemo("Verify Your Email", "verify-email", [
      { key: "username", value: email },
      { key: "code", value: code },
    ]);
  }
}
