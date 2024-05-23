import { CoreEntity } from "src/common/entities/core.entity";
import { Column, Entity } from "typeorm";

type userRole = "client" | "owner" | "delivery";

@Entity()
export class User extends CoreEntity {
  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  role: userRole;
}
