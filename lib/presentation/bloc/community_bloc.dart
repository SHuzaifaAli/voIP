import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../domain/entities/ecommerce_entities.dart';
import '../../domain/usecases/ecommerce_usecases.dart';

abstract class CommunityEvent extends Equatable {
  const CommunityEvent();
  @override
  List<Object?> get props => [];
}

class LoadCommunityEvent extends CommunityEvent {}

abstract class CommunityState extends Equatable {
  const CommunityState();
  @override
  List<Object?> get props => [];
}

class CommunityInitial extends CommunityState {}
class CommunityLoading extends CommunityState {}
class CommunityLoaded extends CommunityState {
  final List<Post> posts;
  final List<Status> statuses;
  final List<Group> groups;
  const CommunityLoaded({required this.posts, required this.statuses, required this.groups});
  @override
  List<Object?> get props => [posts, statuses, groups];
}
class CommunityError extends CommunityState {
  final String message;
  const CommunityError(this.message);
  @override
  List<Object?> get props => [message];
}

class CommunityBloc extends Bloc<CommunityEvent, CommunityState> {
  final GetPosts getPosts;
  final GetStatuses getStatuses;
  final GetGroups getGroups;

  CommunityBloc({required this.getPosts, required this.getStatuses, required this.getGroups}) : super(CommunityInitial()) {
    on<LoadCommunityEvent>((event, emit) async {
      emit(CommunityLoading());
      try {
        final posts = await getPosts.execute();
        final statuses = await getStatuses.execute();
        final groups = await getGroups.execute();
        emit(CommunityLoaded(posts: posts, statuses: statuses, groups: groups));
      } catch (e) {
        emit(CommunityError(e.toString()));
      }
    });
  }
}
