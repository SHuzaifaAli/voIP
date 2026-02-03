import '../entities/ecommerce_entities.dart';
import '../repositories/ecommerce_repository.dart';

class GetProducts {
  final EcommerceRepository repository;
  GetProducts(this.repository);
  Future<List<Product>> execute() async => await repository.getProducts();
}

class GetProductById {
  final EcommerceRepository repository;
  GetProductById(this.repository);
  Future<Product?> execute(String id) async => await repository.getProductById(id);
}

class LoginUseCase {
  final EcommerceRepository repository;
  LoginUseCase(this.repository);
  Future<User?> execute(String email, String password, UserRole role) async => await repository.login(email, password, role);
}

class GetShops {
  final EcommerceRepository repository;
  GetShops(this.repository);
  Future<List<Shop>> execute() async => await repository.getShops();
}

class GetShopById {
  final EcommerceRepository repository;
  GetShopById(this.repository);
  Future<Shop?> execute(String id) async => await repository.getShopById(id);
}

class GetPosts {
  final EcommerceRepository repository;
  GetPosts(this.repository);
  Future<List<Post>> execute() async => await repository.getPosts();
}

class GetStatuses {
  final EcommerceRepository repository;
  GetStatuses(this.repository);
  Future<List<Status>> execute() async => await repository.getStatuses();
}

class GetGroups {
  final EcommerceRepository repository;
  GetGroups(this.repository);
  Future<List<Group>> execute() async => await repository.getGroups();
}

class GetOrders {
  final EcommerceRepository repository;
  GetOrders(this.repository);
  Future<List<Order>> execute(String userId) async => await repository.getOrders(userId);
}

class AddOrder {
  final EcommerceRepository repository;
  AddOrder(this.repository);
  Future<void> execute(Order order) async => await repository.addOrder(order);
}
