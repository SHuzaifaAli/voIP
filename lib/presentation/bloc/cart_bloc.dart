import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/ecommerce_entities.dart';

// Events
abstract class CartEvent extends Equatable {
  const CartEvent();
  @override
  List<Object?> get props => [];
}

class AddToCartEvent extends CartEvent {
  final Product product;
  const AddToCartEvent(this.product);
  @override
  List<Object?> get props => [product];
}

class RemoveFromCartEvent extends CartEvent {
  final String productId;
  const RemoveFromCartEvent(this.productId);
  @override
  List<Object?> get props => [productId];
}

class UpdateQuantityEvent extends CartEvent {
  final String productId;
  final int quantity;
  const UpdateQuantityEvent(this.productId, this.quantity);
  @override
  List<Object?> get props => [productId, quantity];
}

class ClearCartEvent extends CartEvent {}

// State
class CartState extends Equatable {
  final List<CartItem> items;
  
  const CartState({this.items = const []});

  double get total => items.fold(0, (sum, item) => sum + (item.product.price * item.quantity));

  @override
  List<Object?> get props => [items];
}

// BLoC
class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(const CartState()) {
    on<AddToCartEvent>((event, emit) {
      final updatedItems = List<CartItem>.from(state.items);
      final index = updatedItems.indexWhere((item) => item.product.id == event.product.id);
      
      if (index >= 0) {
        updatedItems[index] = CartItem(
          product: event.product,
          quantity: updatedItems[index].quantity + 1,
        );
      } else {
        updatedItems.add(CartItem(product: event.product, quantity: 1));
      }
      emit(CartState(items: updatedItems));
    });

    on<RemoveFromCartEvent>((event, emit) {
      final updatedItems = state.items.where((item) => item.product.id != event.productId).toList();
      emit(CartState(items: updatedItems));
    });

    on<UpdateQuantityEvent>((event, emit) {
      if (event.quantity <= 0) {
        add(RemoveFromCartEvent(event.productId));
        return;
      }
      final updatedItems = state.items.map((item) {
        if (item.product.id == event.productId) {
          return CartItem(product: item.product, quantity: event.quantity);
        }
        return item;
      }).toList();
      emit(CartState(items: updatedItems));
    });

    on<ClearCartEvent>((event, emit) {
      emit(const CartState(items: []));
    });
  }
}
