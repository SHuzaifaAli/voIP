import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_bloc.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Profile")),
      body: BlocBuilder<AuthBloc, AuthState>(
        builder: (context, state) {
          if (state is Authenticated) {
            final user = state.user;
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  const SizedBox(height: 20),
                  CircleAvatar(radius: 60, backgroundImage: NetworkImage(user.avatar ?? "")),
                  const SizedBox(height: 16),
                  Text(user.name, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                  Text(user.email, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: Colors.blue.shade100, borderRadius: BorderRadius.circular(12)),
                    child: Text(user.role.toString().split('.').last.toUpperCase(), style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 24),
                  if (user.bio != null) ...[
                    const Text("About Me", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(user.bio!, textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                  ],
                  const Divider(),
                  ListTile(leading: const Icon(Icons.location_on), title: const Text("Address"), subtitle: Text(user.address ?? "Not provided")),
                  ListTile(leading: const Icon(Icons.phone), title: const Text("Phone"), subtitle: Text(user.phone ?? "Not provided")),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.logout, color: Colors.red),
                    title: const Text("Logout", style: TextStyle(color: Colors.red)),
                    onTap: () {
                      context.read<AuthBloc>().add(LogoutEvent());
                      Navigator.pushReplacementNamed(context, '/login');
                    },
                  ),
                ],
              ),
            );
          }
          return const Center(child: Text("Please login to view profile"));
        },
      ),
    );
  }
}
