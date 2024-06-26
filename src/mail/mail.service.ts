import { Inject, Injectable } from "@nestjs/common";
import * as FormData from "form-data";
import got from "got";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { MailModuleOptions } from "./mail.interfaces";

@Injectable()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(subject: string, content: string) {
    const form = new FormData();
    form.append("from", `Excited User <mailgun@${this.options.domain}>'`);
    form.append("to", `${this.options.toEmail}>'`);
    form.append("subject", subject);
    form.append("text", content);
    const response = await got(
      `https://api.mailgun.net/v3/${this.options.domain}/messages`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.options.apiKey}`).toString("base64")}`,
        },
        method: "POST",
        body: form,
      },
    );
    console.log("📢 [mail.service.ts:29]", response.body);
  }
}
