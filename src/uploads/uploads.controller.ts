import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { FileInterceptor } from "@nestjs/platform-express";
import * as AWS from "aws-sdk";

const BUCKET_NAME = "nubereats-s3";

@Controller("uploads")
export class UploadsController {
  constructor(private readonly configService: ConfigService) {}
  @Post("")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    // AWS 자격 증명 설정
    AWS.config.update({
      credentials: {
        accessKeyId: this.configService.get("AWS_KEY"),
        secretAccessKey: this.configService.get("AWS_SECRET"),
      },
    });

    try {
      // AWS S3 bucket에 파일 업로드 : 업로드할 객체 이름 설정
      const objectName = `${Date.now() + file.originalname}`;

      // S3에 파일 업로드
      const { Location: fileUrl } = await new AWS.S3()
        .upload({
          Body: file.buffer, // 파일 데이터
          Bucket: BUCKET_NAME, // 버킷 이름
          Key: objectName, // 파일의 이름
        })
        .promise();

      return fileUrl;
    } catch (e) {
      console.log("📢 [uploads.controller.ts:42]", e);
      return null;
    }
  }
}
