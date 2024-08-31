import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { OrderItem } from "./entities/order-item.entity";
import { Order } from "./entities/order.entity";
import { OrderService } from "./order.service";

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("OrderService", () => {
  let service: OrderService;
  let ordersRepository: MockRepository<Order>;
  let orderItemsRepository: MockRepository<OrderItem>;
  let restaurantsRepository: MockRepository<Restaurant>;
  let dishesRepository: MockRepository<Dish>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          // Order Repository
          provide: getRepositoryToken(Order),
          useValue: mockRepository(),
        },
        {
          // OrderItem Repository
          provide: getRepositoryToken(OrderItem),
          useValue: mockRepository(),
        },
        {
          // Restaurant Repository
          provide: getRepositoryToken(Restaurant),
          useValue: mockRepository(),
        },
        {
          // Dish Repository
          provide: getRepositoryToken(Dish),
          useValue: mockRepository(),
        },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
    ordersRepository = module.get(getRepositoryToken(Order));
    orderItemsRepository = module.get(getRepositoryToken(OrderItem));
    restaurantsRepository = module.get(getRepositoryToken(Restaurant));
    dishesRepository = module.get(getRepositoryToken(Dish));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  const restaurant = { id: 1, name: "restaurant" } as Restaurant;
  const customer = { id: 1, email: "test@test.com" } as User;

  const DISH_ENTITY = {
    description: "description",
    restaurantId: 1,
    restaurant,
    createAt: new Date(),
    updateAt: new Date(),
  };

  const DISH_ONE: Dish = {
    id: 1,
    name: "name1",
    price: 10,
    options: [],
    ...DISH_ENTITY,
  };

  const DISH_TWO: Dish = {
    id: 2,
    name: "name2",
    price: 15,
    options: [{ name: "option1", extra: 1 }],
    ...DISH_ENTITY,
  };

  const DISH_THREE: Dish = {
    id: 3,
    name: "name3",
    price: 20,
    options: [
      {
        name: "option2",
        choices: [{ name: "choice2-1", extra: 2 }],
      },
    ],
    ...DISH_ENTITY,
  };

  describe("createOrder", () => {
    const createOrderArgs = {
      restaurantId: 1,
      items: [
        {
          dishId: 1,
          options: [{ name: "option1" }],
        },
      ],
    };

    it("should fail if restaurant is not found", async () => {
      restaurantsRepository.findOne.mockResolvedValue(null);

      const result = await service.createOrder(customer, createOrderArgs);

      expect(restaurantsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(restaurantsRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderArgs.restaurantId },
      });
      expect(result).toEqual({
        ok: false,
        error: "레스토랑을 찾을 수 없습니다.",
      });
    });

    it("should fail if dish is not found", async () => {
      // 레스토랑이 실제로 데이터베이스에 있는 것이 아니라면,
      // mockResolvedValue({})로 findOne 메서드가 항상 존재하는 레스토랑을 반환하도록 설정
      // 이렇게 하면, 테스트는 레스토랑이 정상적으로 존재한다고 가정하게 된다.
      restaurantsRepository.findOne.mockResolvedValue(restaurant);
      dishesRepository.findOne.mockResolvedValue(null);

      const result = await service.createOrder(customer, createOrderArgs);

      expect(dishesRepository.findOne).toHaveBeenCalledTimes(1);
      expect(dishesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderArgs.items[0].dishId },
      });
      expect(result).toEqual({ ok: false, error: "요리를 찾을 수 없습니다." });
    });

    // 옵션이 없는 경우 기본 가격을 사용
    it("should use the base price if no options are provided", async () => {
      const createOrderArgs = {
        restaurantId: 1,
        items: [
          {
            dishId: 1,
            options: [], // 옵션이 없는 경우
          },
        ],
      };

      // 기본 가격을 계산
      const dishFinalPrice: number = DISH_ONE.price;

      restaurantsRepository.findOne.mockResolvedValue(restaurant);
      dishesRepository.findOne.mockResolvedValue(DISH_ONE);

      // Mocked order item
      const mockOrderItem = { dish: DISH_ONE, options: [] };
      orderItemsRepository.create.mockReturnValue(mockOrderItem);
      orderItemsRepository.save.mockResolvedValue(mockOrderItem);

      ordersRepository.create.mockReturnValue({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });
      ordersRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createOrder(customer, createOrderArgs);

      expect(dishesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderArgs.items[0].dishId },
      });

      expect(ordersRepository.create).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(ordersRepository.save).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(result).toEqual({ ok: true, orderId: 1 });
    });

    // 추가 비용이 있는 옵션 처리
    it("should add the extra cost of options to the base price", async () => {
      const createOrderArgs = {
        restaurantId: 1,
        items: [
          {
            dishId: 2,
            options: [{ name: "option1" }],
          },
        ],
      };

      // 옵션의 추가 비용을 포함한 최종 가격을 계산
      const extraCost: number = DISH_TWO.options[0].extra || 0;
      const dishFinalPrice: number = DISH_TWO.price + extraCost;

      restaurantsRepository.findOne.mockResolvedValue(restaurant);
      dishesRepository.findOne.mockResolvedValue(DISH_TWO);

      // Mocked order item
      const mockOrderItem = {
        dish: DISH_TWO,
        options: createOrderArgs.items[0].options,
      };
      orderItemsRepository.create.mockReturnValue(mockOrderItem);
      orderItemsRepository.save.mockResolvedValue(mockOrderItem);

      ordersRepository.create.mockReturnValue({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });
      ordersRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createOrder(customer, createOrderArgs);

      expect(dishesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderArgs.items[0].dishId },
      });

      expect(ordersRepository.create).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(ordersRepository.save).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(result).toEqual({ ok: true, orderId: 1 });
    });

    // 선택지에서 추가 비용이 있는 경우 처리
    it("should add the extra cost of option choices to the base price", async () => {
      const createOrderArgs = {
        restaurantId: 1,
        items: [
          {
            dishId: 3,
            options: [
              {
                name: "option2",
                choice: "choice2-1",
              },
            ],
          },
        ],
      };

      // 선택지에서 추가 비용을 포함한 최종 가격을 계산
      const extraCost: number = DISH_THREE.options[0].choices[0].extra || 0;
      const dishFinalPrice: number = DISH_THREE.price + extraCost;

      restaurantsRepository.findOne.mockResolvedValue(restaurant);
      dishesRepository.findOne.mockResolvedValue(DISH_THREE);

      // Mocked order item
      const mockOrderItem = {
        dish: DISH_THREE,
        options: createOrderArgs.items[0].options,
      };

      orderItemsRepository.create.mockReturnValue(mockOrderItem);
      orderItemsRepository.save.mockResolvedValue(mockOrderItem);

      ordersRepository.create.mockReturnValue({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      ordersRepository.save.mockResolvedValue({ id: 1 });

      const result = await service.createOrder(customer, createOrderArgs);

      expect(dishesRepository.findOne).toHaveBeenCalledWith({
        where: { id: createOrderArgs.items[0].dishId },
      });

      expect(ordersRepository.create).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(ordersRepository.save).toHaveBeenCalledWith({
        customer,
        restaurant,
        total: dishFinalPrice,
        items: [mockOrderItem],
      });

      expect(result).toEqual({ ok: true, orderId: 1 });
    });

    it("should fail on exception", async () => {
      restaurantsRepository.findOne.mockRejectedValue(new Error());

      const result = await service.createOrder(customer, createOrderArgs);
      expect(result).toEqual({
        ok: false,
        error: "주문을 만들 수 없습니다.",
      });
    });
  });
});
