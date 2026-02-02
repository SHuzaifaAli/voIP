import 'package:equatable/equatable.dart';

enum UserRole { vendor, consumer }

class User extends Equatable {
  final String id;
  final String name;
  final String email;
  final UserRole role;
  final String? phone;
  final String? address;
  final String? avatar;
  final String? bio;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.address,
    this.avatar,
    this.bio,
  });

  @override
  List<Object?> get props => [id, name, email, role, phone, address, avatar, bio];
}

class Product extends Equatable {
  final String id;
  final String shopId;
  final String name;
  final String description;
  final double price;
  final String image;
  final String category;
  final int stock;
  final double rating;

  const Product({
    required this.id,
    required this.shopId,
    required this.name,
    required this.description,
    required this.price,
    required this.image,
    required this.category,
    required this.stock,
    required this.rating,
  });

  @override
  List<Object?> get props => [id, shopId, name, description, price, image, category, stock, rating];
}

class Shop extends Equatable {
  final String id;
  final String vendorId;
  final String name;
  final String description;
  final String? logo;
  final String? banner;
  final double rating;
  final String? location;

  const Shop({
    required this.id,
    required this.vendorId,
    required this.name,
    required this.description,
    this.logo,
    this.banner,
    required this.rating,
    this.location,
  });

  @override
  List<Object?> get props => [id, vendorId, name, description, logo, banner, rating, location];
}

class CartItem extends Equatable {
  final Product product;
  final int quantity;

  const CartItem({
    required this.product,
    required this.quantity,
  });

  @override
  List<Object?> get props => [product, quantity];
}

enum OrderStatus { pending, confirmed, processing, shipped, delivered, cancelled }

class Order extends Equatable {
  final String id;
  final String userId;
  final List<CartItem> items;
  final double total;
  final OrderStatus status;
  final DateTime date;
  final String shopId;

  const Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.total,
    required this.status,
    required this.date,
    required this.shopId,
  });

  @override
  List<Object?> get props => [id, userId, items, total, status, date, shopId];
}

class Status extends Equatable {
  final String id;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String image;
  final DateTime timestamp;
  final bool viewed;

  const Status({
    required this.id,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.image,
    required this.timestamp,
    required this.viewed,
  });

  @override
  List<Object?> get props => [id, userId, userName, userAvatar, image, timestamp, viewed];
}

enum PostType { post, product, shopPromo }

class Post extends Equatable {
  final String id;
  final String userId;
  final String userName;
  final String? userAvatar;
  final String content;
  final List<String>? images;
  final PostType type;
  final String? productId;
  final String? shopId;
  final int likes;
  final int comments;
  final DateTime timestamp;

  const Post({
    required this.id,
    required this.userId,
    required this.userName,
    this.userAvatar,
    required this.content,
    this.images,
    required this.type,
    this.productId,
    this.shopId,
    required this.likes,
    required this.comments,
    required this.timestamp,
  });

  @override
  List<Object?> get props => [id, userId, userName, userAvatar, content, images, type, productId, shopId, likes, comments, timestamp];
}

class Group extends Equatable {
  final String id;
  final String name;
  final String description;
  final String creatorId;
  final List<String> members;
  final String? image;
  final String category;

  const Group({
    required this.id,
    required this.name,
    required this.description,
    required this.creatorId,
    required this.members,
    this.image,
    required this.category,
  });

  @override
  List<Object?> get props => [id, name, description, creatorId, members, image, category];
}
