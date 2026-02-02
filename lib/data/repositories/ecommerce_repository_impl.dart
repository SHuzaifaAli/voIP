import '../../domain/entities/ecommerce_entities.dart';
import '../../domain/repositories/ecommerce_repository.dart';
import '../datasources/ecommerce_remote_data_source.dart';

class EcommerceRepositoryImpl implements EcommerceRepository {
  final EcommerceRemoteDataSource remoteDataSource;

  EcommerceRepositoryImpl({required this.remoteDataSource});

  @override
  Future<User?> login(String email, String password, UserRole role) async {
    return await remoteDataSource.login(email, password, role);
  }

  @override
  Future<void> logout() async {
    // Implementation for logout if needed
  }

  @override
  Future<List<Product>> getProducts() async {
    return await remoteDataSource.getProducts();
  }

  @override
  Future<Product?> getProductById(String id) async {
    final products = await remoteDataSource.getProducts();
    try {
      return products.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }

  @override
  Future<List<Shop>> getShops() async {
    return await remoteDataSource.getShops();
  }

  @override
  Future<Shop?> getShopById(String id) async {
    final shops = await remoteDataSource.getShops();
    try {
      return shops.firstWhere((s) => s.id == id);
    } catch (e) {
      return null;
    }
  }

  @override
  Future<List<Order>> getOrders(String userId) async {
    // Mock orders
    return [];
  }

  @override
  Future<void> addOrder(Order order) async {
    // Implementation for adding order
  }

  @override
  Future<List<Post>> getPosts() async {
    return await remoteDataSource.getPosts();
  }

  @override
  Future<List<Status>> getStatuses() async {
    // Mock statuses
    return [];
  }

  @override
  Future<List<Group>> getGroups() async {
    // Mock groups
    return [];
  }
}
