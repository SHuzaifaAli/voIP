import 'package:get_it/get_it.dart';
import 'domain/repositories/ecommerce_repository.dart';
import 'data/repositories/ecommerce_repository_impl.dart';
import 'data/datasources/ecommerce_remote_data_source.dart';
import 'domain/usecases/ecommerce_usecases.dart';
import 'presentation/bloc/auth_bloc.dart';
import 'presentation/bloc/product_bloc.dart';
import 'presentation/bloc/cart_bloc.dart';
import 'presentation/bloc/shop_bloc.dart';
import 'presentation/bloc/community_bloc.dart';

final sl = GetIt.instance;

Future<void> init() async {
  // Blocs
  sl.registerFactory(() => AuthBloc(loginUseCase: sl()));
  sl.registerFactory(() => ProductBloc(getProducts: sl()));
  sl.registerLazySingleton(() => CartBloc());
  sl.registerFactory(() => ShopBloc(getShops: sl(), getShopById: sl(), getProducts: sl()));
  sl.registerFactory(() => CommunityBloc(getPosts: sl(), getStatuses: sl(), getGroups: sl()));

  // Use cases
  sl.registerLazySingleton(() => LoginUseCase(sl()));
  sl.registerLazySingleton(() => GetProducts(sl()));
  sl.registerLazySingleton(() => GetProductById(sl()));
  sl.registerLazySingleton(() => GetShops(sl()));
  sl.registerLazySingleton(() => GetShopById(sl()));
  sl.registerLazySingleton(() => GetPosts(sl()));
  sl.registerLazySingleton(() => GetStatuses(sl()));
  sl.registerLazySingleton(() => GetGroups(sl()));
  sl.registerLazySingleton(() => GetOrders(sl()));
  sl.registerLazySingleton(() => AddOrder(sl()));

  // Repository
  sl.registerLazySingleton<EcommerceRepository>(
    () => EcommerceRepositoryImpl(remoteDataSource: sl()),
  );

  // Data sources
  sl.registerLazySingleton<EcommerceRemoteDataSource>(
    () => EcommerceRemoteDataSourceImpl(),
  );
}
