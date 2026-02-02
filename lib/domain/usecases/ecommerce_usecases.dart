import '../entities/ecommerce_entities.dart';
import '../repositories/ecommerce_repository.dart';

class GetProducts {
  final EcommerceRepository repository;
  GetProducts(this.repository);

  Future<List<Product>> execute() async {
    return await repository.getProducts();
  }
}

class LoginUseCase {
  final EcommerceRepository repository;
  LoginUseCase(this.repository);

  Future<User?> execute(String email, String password, UserRole role) async {
    return await repository.login(email, password, role);
  }
}

class GetShops {
  final EcommerceRepository repository;
  GetShops(this.repository);

  Future<List<Shop>> execute() async {
    return await repository.getShops();
  }
}

class GetPosts {
  final EcommerceRepository repository;
  GetPosts(this.repository);

  Future<List<Post>> execute() async {
    return await repository.getPosts();
  }
}
