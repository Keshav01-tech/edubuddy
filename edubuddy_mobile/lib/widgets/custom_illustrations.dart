import 'package:flutter/material.dart';

/// Decorative background arches for Onboarding Screen
class OnboardingArchesPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.45);

    // Outer soft grey/lavender ring
    final paintRing1 = Paint()
      ..color = const Color(0xFFF1F3F7)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 36;
    canvas.drawCircle(center, size.width * 0.46, paintRing1);

    // Mint/Sage middle arc
    final paintRing2 = Paint()
      ..color = const Color(0xFFBCE7D0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 28
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: size.width * 0.38),
      -3.14 * 0.85,
      3.14 * 1.7,
      false,
      paintRing2,
    );

    // Warm peach inner arc
    final paintRing3 = Paint()
      ..color = const Color(0xFFFFD5C0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 24
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: size.width * 0.30),
      -3.14 * 0.75,
      3.14 * 1.5,
      false,
      paintRing3,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Stylized Student Avatar Artwork for Onboarding
class StudentOnboardingVisual extends StatelessWidget {
  const StudentOnboardingVisual({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 380,
      width: double.infinity,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background custom geometric arches
          Positioned.fill(
            child: CustomPaint(
              painter: OnboardingArchesPainter(),
            ),
          ),

          // Central Student Graphic Container
          Positioned(
            bottom: 0,
            child: Container(
              width: 250,
              height: 320,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
              ),
              child: Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  // Stylized Student Illustration
                  Container(
                    width: 220,
                    height: 300,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFE2E8F0), Color(0xFFCBD5E1)],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                      borderRadius: BorderRadius.circular(100),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(100),
                      child: Image.network(
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          // Fallback high quality stylized avatar
                          return const Center(
                            child: Icon(
                              Icons.school_rounded,
                              size: 100,
                              color: Color(0xFF475569),
                            ),
                          );
                        },
                      ),
                    ),
                  ),

                  // Orange notebook overlay
                  Positioned(
                    left: 20,
                    bottom: 25,
                    child: Transform.rotate(
                      angle: -0.15,
                      child: Container(
                        width: 75,
                        height: 95,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF97316),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF97316).withValues(alpha: 0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 40,
                              height: 4,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Container(
                              width: 28,
                              height: 4,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.8),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// 3D Stationery Artwork for Today's Class Card (Creative Sketching)
class StationeryArtWidget extends StatelessWidget {
  const StationeryArtWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 105,
      height: 105,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Pastel floating circle backdrop
          Container(
            width: 85,
            height: 85,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withValues(alpha: 0.55),
            ),
          ),

          // Stylized 3D Pen Holder
          Positioned(
            bottom: 4,
            child: Container(
              width: 52,
              height: 48,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF67B0E8), Color(0xFF4A90E2)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(8),
                  bottom: Radius.circular(14),
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4A90E2).withValues(alpha: 0.35),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
            ),
          ),

          // Colorful stationery tools sticking out
          // Pencil 1 (Yellow)
          Positioned(
            bottom: 30,
            left: 36,
            child: Transform.rotate(
              angle: -0.28,
              child: Container(
                width: 8,
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFFBBF24),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),

          // Pencil 2 (Pink/Rose)
          Positioned(
            bottom: 32,
            right: 36,
            child: Transform.rotate(
              angle: 0.28,
              child: Container(
                width: 8,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFF472B6),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
          ),

          // Ruler / Brush (Purple)
          Positioned(
            bottom: 35,
            child: Container(
              width: 10,
              height: 48,
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6),
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),

          // Floating 3D Star / Badge
          Positioned(
            top: 6,
            right: 10,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: const Color(0xFFF43F5E),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFF43F5E).withValues(alpha: 0.4),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(
                Icons.palette_rounded,
                size: 11,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Chalkboard & Professor Artwork for Screen 3
class PhysicsTeacherArtWidget extends StatelessWidget {
  const PhysicsTeacherArtWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 120,
      height: 120,
      child: Stack(
        alignment: Alignment.centerRight,
        children: [
          // Chalkboard in background
          Positioned(
            left: 0,
            top: 15,
            child: Container(
              width: 75,
              height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF1E5638),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFFD4A373),
                  width: 3,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(6),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Physics',
                    style: TextStyle(
                      color: Color(0xFFE2E8F0),
                      fontSize: 8,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    width: 35,
                    height: 2,
                    color: Colors.white.withValues(alpha: 0.4),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'E = mc²',
                    style: TextStyle(
                      color: Color(0xFFFEF08A),
                      fontSize: 7.5,
                      fontFamily: 'monospace',
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'F = ma',
                    style: TextStyle(
                      color: Color(0xFF93C5FD),
                      fontSize: 7.5,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ),
            ),
          ),

          // 3D Avatar Teacher Character
          Positioned(
            right: 2,
            bottom: 0,
            child: Container(
              width: 72,
              height: 96,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: const Color(0xFF3B82F6),
                      child: const Icon(
                        Icons.person_outline_rounded,
                        color: Colors.white,
                        size: 36,
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
