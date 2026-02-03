import '../../domain/entities/ecommerce_entities.dart';

class UserModel extends User {
  const UserModel({required super.id, required super.name, required super.email, required super.role, super.phone, super.address, super.avatar, super.bio});
  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(id: json['id'], name: json['name'], email: json['email'], role: json['role'] == 'vendor' ? UserRole.vendor : UserRole.consumer, phone: json['phone'], address: json['address'], avatar: json['avatar'], bio: json['bio']);
}

class ProductModel extends Product {
  const ProductModel({required super.id, required super.shopId, required super.name, required super.description, required super.price, required super.image, required super.category, required super.stock, required super.rating});
  factory ProductModel.fromJson(Map<String, dynamic> json) => ProductModel(id: json['id'], shopId: json['shopId'], name: json['name'], description: json['description'], price: (json['price'] as num).toDouble(), image: json['image'], category: json['category'], stock: json['stock'], rating: (json['rating'] as num).toDouble());
}

class ShopModel extends Shop {
  const ShopModel({required super.id, required super.vendorId, required super.name, required super.description, super.logo, super.banner, required super.rating, super.location});
  factory ShopModel.fromJson(Map<String, dynamic> json) => ShopModel(id: json['id'], vendorId: json['vendorId'], name: json['name'], description: json['description'], logo: json['logo'], banner: json['banner'], rating: (json['rating'] as num).toDouble(), location: json['location']);
}

class PostModel extends Post {
  const PostModel({required super.id, required super.userId, required super.userName, super.userAvatar, required super.content, super.images, required super.type, super.productId, super.shopId, required super.likes, required super.comments, required super.timestamp});
  factory PostModel.fromJson(Map<String, dynamic> json) => PostModel(id: json['id'], userId: json['userId'], userName: json['userName'], userAvatar: json['userAvatar'], content: json['content'], images: json['images'] != null ? List<String>.from(json['images']) : null, type: json['type'] == 'product' ? PostType.product : (json['type'] == 'shop_promo' ? PostType.shopPromo : PostType.post), productId: json['productId'], shopId: json['shopId'], likes: json['likes'], comments: json['comments'], timestamp: json['timestamp'] is DateTime ? json['timestamp'] : DateTime.parse(json['timestamp'].toString()));
}

class StatusModel extends Status {
  const StatusModel({required super.id, required super.userId, required super.userName, super.userAvatar, required super.image, required super.timestamp, required super.viewed});
  factory StatusModel.fromJson(Map<String, dynamic> json) => StatusModel(id: json['id'], userId: json['userId'], userName: json['userName'], userAvatar: json['userAvatar'], image: json['image'], timestamp: DateTime.parse(json['timestamp'].toString()), viewed: json['viewed']);
}

class GroupModel extends Group {
  const GroupModel({required super.id, required super.name, required super.description, required super.creatorId, required super.members, super.image, required super.category});
  factory GroupModel.fromJson(Map<String, dynamic> json) => GroupModel(id: json['id'], name: json['name'], description: json['description'], creatorId: json['creatorId'], members: List<String>.from(json['members']), image: json['image'], category: json['category']);
}
