import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Dish } from "src/restaurant/entities/dish.entity";
import { Restaurant } from "src/restaurant/entities/restaurant.entity";
import { User, UserRole } from "src/user/entities/user.entity";
import { Repository } from "typeorm";
import { OrderItem } from "./entities/order-item.entity";
import { Order, OrderStatus } from "./entities/order.entity";
import { OrderService } from "./order.service";
import { PUB_SUB } from "src/common/common.constants";
import { PubSub } from "graphql-subscriptions";

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
});

const mockPubsub = () => ({
  publish: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe("OrderService", () => {
  let service: OrderService;
  let ordersRepository: MockRepository<Order>;
  let orderItemsRepository: MockRepository<OrderItem>;
  let restaurantsRepository: MockRepository<Restaurant>;
  let dishesRepository: MockRepository<Dish>;
  let pubsub: PubSub;

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
        {
          // PubSub Repository
          provide: PUB_SUB,
          useValue: mockPubsub(),
        },
      ],
    }).compile();
    service = module.get<OrderService>(OrderService);
    ordersRepository = module.get(getRepositoryToken(Order));
    orderItemsRepository = module.get(getRepositoryToken(OrderItem));
    restaurantsRepository = module.get(getRepositoryToken(Restaurant));
    dishesRepository = module.get(getRepositoryToken(Dish));
  });

  it("OrderService를 정의합니다.", () => {
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

    it("레스토랑이 존재하지 않는 경우 주문을 생성할 수 없습니다.", async () => {
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

    it("음식이 존재하지 않는 경우 주문을 생성할 수 없습니다.", async () => {
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
      expect(result).toEqual({
        ok: false,
        error: "주문한 음식을 찾을 수 없습니다.",
      });
    });

    // 옵션이 없는 경우 기본 가격을 사용
    it("옵션이 제공되지 않으면 기준 가격을 사용해야 합니다.", async () => {
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
    it("기본 가격에 옵션 추가 비용을 추가해야 합니다.", async () => {
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
    it("기본 가격에 옵션 선택의 추가 비용을 추가해야 합니다.", async () => {
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

    it("예외가 발생한 경우 주문을 생성할 수 없습니다.", async () => {
      restaurantsRepository.findOne.mockRejectedValue(new Error());

      const result = await service.createOrder(customer, createOrderArgs);
      expect(result).toEqual({
        ok: false,
        error: "주문을 만들 수 없습니다.",
      });
    });
  });

  describe("getOrders", () => {
    it("사용자가 클라이언트일 때 올바르게 주문을 가져와야 합니다.", async () => {
      const mockUser = { id: 1, role: UserRole.Client } as User;
      const mockOrders = [{ id: 1 }, { id: 2 }];

      ordersRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getOrders(mockUser, {
        status: OrderStatus.Pending,
      });

      expect(ordersRepository.find).toHaveBeenCalledWith({
        where: {
          customer: { id: mockUser.id },
          status: "Pending",
        },
      });

      expect(result).toEqual({
        ok: true,
        orders: mockOrders,
      });
    });

    it("사용자가 배달원일 때 올바르게 주문을 가져와야 합니다.", async () => {
      const mockUser = { id: 2, role: UserRole.Delivery } as User;
      const mockOrders = [{ id: 3 }, { id: 4 }];

      ordersRepository.find.mockResolvedValue(mockOrders);

      const result = await service.getOrders(mockUser, {
        status: OrderStatus.PickedUp,
      });

      expect(ordersRepository.find).toHaveBeenCalledWith({
        where: {
          driver: { id: mockUser.id },
          status: "PickedUp",
        },
      });

      expect(result).toEqual({
        ok: true,
        orders: mockOrders,
      });
    });

    it("사용자가 식당 주인일 때 올바르게 주문을 가져와야 합니다.", async () => {
      const mockUser = { id: 3, role: UserRole.Owner } as User;
      const mockRestaurants = [
        {
          id: 1,
          orders: [
            { id: 5, status: "Pending" },
            { id: 6, status: "Completed" },
          ],
        },
        { id: 2, orders: [{ id: 7, status: "Pending" }] },
      ];

      restaurantsRepository.find.mockResolvedValue(mockRestaurants);

      const result = await service.getOrders(mockUser, {
        status: OrderStatus.Pending,
      });

      expect(restaurantsRepository.find).toHaveBeenCalledWith({
        where: { owner: { id: mockUser.id } },
        relations: ["orders"],
      });

      expect(result).toEqual({
        ok: true,
        orders: [
          { id: 5, status: "Pending" },
          { id: 7, status: "Pending" },
        ],
      });
    });

    it("잘못된 역할을 가진 사용자는 에러를 반환해야 합니다.", async () => {
      const invalidRole = "InvalidRole" as UserRole;

      const mockUser = { id: 4, role: invalidRole } as User;

      const result = await service.getOrders(mockUser, {
        status: OrderStatus.Pending,
      });

      // ordersRepository.find와 restaurantsRepository.find가 호출되지 않았는지 확인
      expect(ordersRepository.find).not.toHaveBeenCalled();
      expect(restaurantsRepository.find).not.toHaveBeenCalled();

      expect(result).toEqual({
        ok: false,
        error: "역할을 찾을 수 없습니다.",
      });
    });

    it("주문을 가져오는 중 에러가 발생하면 에러 메시지를 반환해야 합니다.", async () => {
      const mockUser = { id: 5, role: UserRole.Owner } as User;

      ordersRepository.findOne.mockRejectedValue(new Error());

      const result = await service.getOrders(mockUser, {
        status: OrderStatus.Cooking,
      });

      expect(result).toEqual({
        ok: false,
        error: "주문을 받을 수 없습니다.",
      });
    });
  });
});
