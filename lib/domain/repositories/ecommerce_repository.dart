import '../entities/ecommerce_entities.dart';

abstract class EcommerceRepository {
  // Auth
  Future<User?> login(String email, String password, UserRole role);
  Future<void> logout();
  
  // Products
  Future<List<Product>> getProducts();
  Future<Product?> getProductById(String id);
  
  // Shops
  Future<List<Shop>> getShops();
  Future<Shop?> getShopById(String id);
  
  // Orders
  Future<List<Order>> getOrders(String userId);
  Future<void> addOrder(Order order);
  
  // Community
  Future<List<Post>> getPosts();
  Future<List<Status>> getStatuses();
  Future<List<Group>> getGroups();
}
