import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../../restaurant/entities/category.entity";
import { CATEGORIES } from "../../constants/categories";

@Injectable()
export class CategorySeed {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async run() {
    for (const cat of CATEGORIES) {
      const existing = await this.categories.findOne({
        where: { slug: cat.slug },
      });

      if (existing) {
        // slug는 같지만 name이나 coverImg가 다르면 업데이트
        if (existing.name !== cat.name || existing.coverImg !== cat.coverImg) {
          existing.name = cat.name;
          existing.coverImg = cat.coverImg;
          await this.categories.save(existing);
          console.log(`🔄 업데이트 카테고리: ${cat.slug} → ${cat.name}`);
        }
      } else {
        // 기존에 없으면 새로 생성
        await this.categories.save(this.categories.create(cat));
        console.log(`✅ 신규 카테고리 : ${cat.name}`);
      }
    }
  }
}
