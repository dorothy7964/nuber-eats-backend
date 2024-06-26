export interface MailModuleOptions {
  apiKey: string;
  domain: string; // 메일의 송신처 도메인
  fromEmail: string;
  toEmail: string; // 메일건에서 무료계정 사용으로 받는사람이 한정되어 있음
}
