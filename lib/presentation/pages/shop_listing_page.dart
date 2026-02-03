import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/shop_bloc.dart';
import 'shop_detail_page.dart';

class ShopListingPage extends StatefulWidget {
  const ShopListingPage({super.key});

  @override
  State<ShopListingPage> createState() => _ShopListingPageState();
}

class _ShopListingPageState extends State<ShopListingPage> {
  @override
  void initState() {
    super.initState();
    context.read<ShopBloc>().add(LoadShopsEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Shops")),
      body: BlocBuilder<ShopBloc, ShopState>(
        builder: (context, state) {
          if (state is ShopLoading) return const Center(child: CircularProgressIndicator());
          if (state is ShopsLoaded) {
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: state.shops.length,
              itemBuilder: (context, index) {
                final shop = state.shops[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: CircleAvatar(backgroundImage: NetworkImage(shop.logo ?? ""), radius: 30),
                    title: Text(shop.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(shop.description, maxLines: 1, overflow: TextOverflow.ellipsis),
                        Row(
                          children: [
                            const Icon(Icons.star, color: Colors.amber, size: 16),
                            Text(" ${shop.rating} • ${shop.location}"),
                          ],
                        ),
                      ],
                    ),
                    onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ShopDetailPage(shopId: shop.id))),
                  ),
                );
              },
            );
          }
          return const SizedBox();
        },
      ),
    );
  }
}
