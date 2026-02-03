import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/ecommerce_entities.dart';
import '../../domain/usecases/ecommerce_usecases.dart';

abstract class ShopEvent extends Equatable {
  const ShopEvent();
  @override
  List<Object?> get props => [];
}

class LoadShopsEvent extends ShopEvent {}
class LoadShopDetailEvent extends ShopEvent {
  final String shopId;
  const LoadShopDetailEvent(this.shopId);
  @override
  List<Object?> get props => [shopId];
}

abstract class ShopState extends Equatable {
  const ShopState();
  @override
  List<Object?> get props => [];
}

class ShopInitial extends ShopState {}
class ShopLoading extends ShopState {}
class ShopsLoaded extends ShopState {
  final List<Shop> shops;
  const ShopsLoaded(this.shops);
  @override
  List<Object?> get props => [shops];
}
class ShopDetailLoaded extends ShopState {
  final Shop shop;
  final List<Product> products;
  const ShopDetailLoaded(this.shop, this.products);
  @override
  List<Object?> get props => [shop, products];
}
class ShopError extends ShopState {
  final String message;
  const ShopError(this.message);
  @override
  List<Object?> get props => [message];
}

class ShopBloc extends Bloc<ShopEvent, ShopState> {
  final GetShops getShops;
  final GetShopById getShopById;
  final GetProducts getProducts;

  ShopBloc({required this.getShops, required this.getShopById, required this.getProducts}) : super(ShopInitial()) {
    on<LoadShopsEvent>((event, emit) async {
      emit(ShopLoading());
      try {
        final shops = await getShops.execute();
        emit(ShopsLoaded(shops));
      } catch (e) {
        emit(ShopError(e.toString()));
      }
    });

    on<LoadShopDetailEvent>((event, emit) async {
      emit(ShopLoading());
      try {
        final shop = await getShopById.execute(event.shopId);
        final allProducts = await getProducts.execute();
        final shopProducts = allProducts.where((p) => p.shopId == event.shopId).toList();
        if (shop != null) {
          emit(ShopDetailLoaded(shop, shopProducts));
        } else {
          emit(const ShopError("Shop not found"));
        }
      } catch (e) {
        emit(ShopError(e.toString()));
      }
    });
  }
}
