import '../models/ecommerce_models.dart';
import '../../domain/entities/ecommerce_entities.dart';

abstract class EcommerceRemoteDataSource {
  Future<List<ProductModel>> getProducts();
  Future<List<ShopModel>> getShops();
  Future<List<PostModel>> getPosts();
  Future<UserModel?> login(String email, String password, UserRole role);
}

class EcommerceRemoteDataSourceImpl implements EcommerceRemoteDataSource {
  @override
  Future<List<ProductModel>> getProducts() async {
    // Simulated delay
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      const ProductModel(
        id: '1',
        shopId: '1',
        name: 'Wireless Headphones',
        description: 'Premium wireless headphones with noise cancellation',
        price: 99.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        category: 'Electronics',
        stock: 50,
        rating: 4.5,
      ),
      const ProductModel(
        id: '2',
        shopId: '1',
        name: 'Smart Watch',
        description: 'Fitness tracking smartwatch with heart rate monitor',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop',
        category: 'Electronics',
        stock: 30,
        rating: 4.7,
      ),
      const ProductModel(
        id: '3',
        shopId: '2',
        name: 'Running Shoes',
        description: 'Comfortable running shoes for all terrains',
        price: 79.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
        category: 'Fashion',
        stock: 100,
        rating: 4.3,
      ),
    ];
  }

  @override
  Future<List<ShopModel>> getShops() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      const ShopModel(
        id: '1',
        vendorId: '1',
        name: 'TechHub Store',
        description: 'Your one-stop shop for the latest electronics and gadgets',
        logo: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=200&h=200&fit=crop',
        banner: 'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=800&h=300&fit=crop',
        rating: 4.6,
        location: 'New York, USA',
      ),
    ];
  }

  @override
  Future<List<PostModel>> getPosts() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      PostModel(
        id: '1',
        userId: '1',
        userName: 'TechHub Store',
        userAvatar: 'https://images.unsplash.com/photo-1567581935884-3349723552ca?w=100&h=100&fit=crop',
        content: 'Check out our latest wireless headphones! Premium sound quality at an affordable price. 🎧',
        images: const ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop'],
        type: PostType.product,
        productId: '1',
        shopId: '1',
        likes: 45,
        comments: 12,
        timestamp: DateTime.now().subtract(const Duration(hours: 3)),
      ),
    ];
  }

  @override
  Future<UserModel?> login(String email, String password, UserRole role) async {
    await Future.delayed(const Duration(seconds: 1));
    return UserModel(
      id: '1',
      name: role == UserRole.vendor ? 'John Vendor' : 'Jane Consumer',
      email: email,
      role: role,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
      bio: role == UserRole.vendor ? 'Professional seller with 5 years experience' : 'Love shopping online!',
      phone: '+1 234 567 890',
      address: '123 Main St, City, Country',
    );
  }
}
