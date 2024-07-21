import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category } from "../entities/category.entity";

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  async getOrCreate(name: string): Promise<Category> {
    const categoryName = name.trim().toLowerCase();
    const categorySlug = categoryName.replace(/ /g, "-");
    let category = await this.categories.findOne({
      where: { slug: categorySlug },
    });
    if (!category) {
      category = this.categories.create({
        slug: categorySlug,
        name: categoryName,
      });
      category = await this.categories.save(category);
    }
    return category;
  }
}
