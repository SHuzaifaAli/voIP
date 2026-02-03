import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/community_bloc.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  @override
  void initState() {
    super.initState();
    context.read<CommunityBloc>().add(LoadCommunityEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Community")),
      body: BlocBuilder<CommunityBloc, CommunityState>(
        builder: (context, state) {
          if (state is CommunityLoading) return const Center(child: CircularProgressIndicator());
          if (state is CommunityLoaded) {
            return SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Statuses
                  SizedBox(
                    height: 100,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: state.statuses.length,
                      itemBuilder: (context, index) {
                        final status = state.statuses[index];
                        return Padding(
                          padding: const EdgeInsets.only(right: 12),
                          child: Column(
                            children: [
                              CircleAvatar(
                                radius: 30,
                                backgroundColor: status.viewed ? Colors.grey : Colors.blue,
                                child: CircleAvatar(radius: 27, backgroundImage: NetworkImage(status.userAvatar ?? "")),
                              ),
                              const SizedBox(height: 4),
                              Text(status.userName, style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                  const Divider(),
                  // Posts
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: state.posts.length,
                    itemBuilder: (context, index) {
                      final post = state.posts[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ListTile(
                              leading: CircleAvatar(backgroundImage: NetworkImage(post.userAvatar ?? "")),
                              title: Text(post.userName, style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(post.timestamp.toString().split('.')[0]),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(post.content),
                            ),
                            if (post.images != null && post.images!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Image.network(post.images![0], fit: BoxFit.cover, width: double.infinity),
                              ),
                            Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  const Icon(Icons.favorite_border, size: 20),
                                  Text(" ${post.likes}  "),
                                  const Icon(Icons.comment_outlined, size: 20),
                                  Text(" ${post.comments}"),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}
