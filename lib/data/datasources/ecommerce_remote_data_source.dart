import '../models/ecommerce_models.dart';
import '../../domain/entities/ecommerce_entities.dart';

abstract class EcommerceRemoteDataSource {
  Future<List<ProductModel>> getProducts();
  Future<List<ShopModel>> getShops();
  Future<List<PostModel>> getPosts();
  Future<List<StatusModel>> getStatuses();
  Future<List<GroupModel>> getGroups();
  Future<UserModel?> login(String email, String password, UserRole role);
}

class EcommerceRemoteDataSourceImpl implements EcommerceRemoteDataSource {
  @override
  Future<List<ProductModel>> getProducts() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [
      const ProductModel(id: '1', shopId: '1', name: 'Wireless Headphones', description: 'Premium wireless headphones with noise cancellation', price: 99.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', category: 'Electronics', stock: 50, rating: 4.5),
      const ProductModel(id: '2', shopId: '1', name: 'Smart Watch', description: 'Fitness tracking smartwatch with heart rate monitor', price: 199.99, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', category: 'Electronics', stock: 30, rating: 4.7),
      const ProductModel(id: '3', shopId: '2', name: 'Running Shoes', description: 'Comfortable running shoes for all terrains', price: 79.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', category: 'Fashion', stock: 100, rating: 4.3),
      const ProductModel(id: '4', shopId: '2', name: 'Leather Backpack', description: 'Stylish leather backpack for daily use', price: 129.99, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', category: 'Fashion', stock: 25, rating: 4.6),
      const ProductModel(id: '5', shopId: '3', name: 'Coffee Maker', description: 'Automatic coffee maker with timer function', price: 89.99, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&h=400&fit=crop', category: 'Home', stock: 40, rating: 4.4),
      const ProductModel(id: '6', shopId: '3', name: 'Kitchen Knife Set', description: 'Professional kitchen knife set with block', price: 149.99, image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=400&h=400&fit=crop', category: 'Home', stock: 20, rating: 4.8),
    ];
  }

  @override
  Future<List<ShopModel>> getShops() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [
      const ShopModel(id: '1', vendorId: '1', name: 'TechHub Store', description: 'Your one-stop shop for the latest electronics and gadgets', logo: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=200&h=200&fit=crop', banner: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=300&fit=crop', rating: 4.6, location: 'New York, USA'),
      const ShopModel(id: '2', vendorId: '2', name: 'Fashion Avenue', description: 'Trendy fashion and accessories for modern lifestyle', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=200&fit=crop', banner: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=300&fit=crop', rating: 4.5, location: 'Los Angeles, USA'),
      const ShopModel(id: '3', vendorId: '3', name: 'Home Essentials', description: 'Quality home and kitchen products for your daily needs', logo: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=200&h=200&fit=crop', banner: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=800&h=300&fit=crop', rating: 4.7, location: 'Chicago, USA'),
    ];
  }

  @override
  Future<List<PostModel>> getPosts() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return [
      PostModel(id: '1', userId: '1', userName: 'TechHub Store', userAvatar: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=100&h=100&fit=crop', content: 'Check out our latest wireless headphones! Premium sound quality at an affordable price. 🎧', images: const ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'], type: PostType.product, productId: '1', shopId: '1', likes: 45, comments: 12, timestamp: DateTime.now().subtract(const Duration(hours: 3))),
      PostModel(id: '2', userId: '2', userName: 'Fashion Avenue', userAvatar: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop', content: 'New collection just dropped! Visit our store for exclusive deals on running shoes. 👟', images: const ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'], type: PostType.shopPromo, shopId: '2', likes: 78, comments: 23, timestamp: DateTime.now().subtract(const Duration(hours: 6))),
    ];
  }

  @override
  Future<List<StatusModel>> getStatuses() async {
    return [
      StatusModel(id: '1', userId: '1', userName: 'TechHub Store', userAvatar: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=100&h=100&fit=crop', image: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=600&fit=crop', timestamp: DateTime.now().subtract(const Duration(hours: 2)), viewed: false),
    ];
  }

  @override
  Future<List<GroupModel>> getGroups() async {
    return [
      const GroupModel(id: '1', name: 'Tech Enthusiasts', description: 'A community for people who love technology and gadgets', creatorId: '1', members: ['1', '4', '5', '6'], image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop', category: 'Electronics'),
    ];
  }

  @override
  Future<UserModel?> login(String email, String password, UserRole role) async {
    await Future.delayed(const Duration(milliseconds: 500));
    return UserModel(id: '1', name: role == UserRole.vendor ? 'John Vendor' : 'Jane Consumer', email: email, role: role, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', bio: role == UserRole.vendor ? 'Professional seller with 5 years experience' : 'Love shopping online!', phone: '+1 234 567 890', address: '123 Main St, City, Country');
  }
}
