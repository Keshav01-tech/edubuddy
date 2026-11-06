import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_illustrations.dart';
import 'home_dashboard_screen.dart';

class OnboardingScreen extends StatelessWidget {
  const OnboardingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FA),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Top Status Space
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    '9:30',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Row(
                    children: [
                      Icon(Icons.signal_cellular_alt_rounded,
                          size: 16, color: Colors.grey[700]),
                      const SizedBox(width: 4),
                      Icon(Icons.wifi_rounded,
                          size: 16, color: Colors.grey[700]),
                      const SizedBox(width: 4),
                      Icon(Icons.battery_full_rounded,
                          size: 16, color: Colors.grey[700]),
                    ],
                  ),
                ],
              ),
            ),

            // Top Hero Visual (Student with Arches)
            const Expanded(
              flex: 5,
              child: StudentOnboardingVisual(),
            ),

            // Bottom Sheet Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(28, 32, 28, 36),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(
                  top: Radius.circular(38),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x0D000000),
                    blurRadius: 30,
                    offset: Offset(0, -6),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Institute Tag
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFDBEAFE)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.school_rounded,
                            size: 13, color: Color(0xFF2563EB)),
                        SizedBox(width: 6),
                        Text(
                          'EduBuddy · Coaching OS',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1D4ED8),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Headline
                  const Text(
                    'Effortless Coaching\nManagement On\nAutopilot!',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 27,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                      height: 1.22,
                      letterSpacing: -0.6,
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Subtitle
                  const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10),
                    child: Text(
                      'Take 1-tap haziri, print NCERT test papers in 30 seconds, and collect batch fees with automated WhatsApp parent delivery.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w400,
                        color: AppColors.textSecondary,
                        height: 1.45,
                      ),
                    ),
                  ),

                  const SizedBox(height: 28),

                  // Action Pill (Continue to Dashboard)
                  GestureDetector(
                    onTap: () {
                      Navigator.pushReplacement(
                        context,
                        PageRouteBuilder(
                          pageBuilder: (context, anim1, anim2) =>
                              const HomeDashboardScreen(),
                          transitionsBuilder: (context, anim1, anim2, child) {
                            return FadeTransition(opacity: anim1, child: child);
                          },
                          transitionDuration: const Duration(milliseconds: 300),
                        ),
                      );
                    },
                    child: Container(
                      width: double.infinity,
                      height: 58,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F4F8),
                        borderRadius: BorderRadius.circular(30),
                        border: Border.all(
                          color: const Color(0xFFE2E8F0),
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          // Left Checkmark circle
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 8,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.arrow_forward_rounded,
                              color: AppColors.textPrimary,
                              size: 20,
                            ),
                          ),

                          // Center Continue Text
                          const Expanded(
                            child: Center(
                              child: Text(
                                'Open Institute Dashboard',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: AppColors.textPrimary,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                          ),

                          // Right Chevrons
                          Padding(
                            padding: const EdgeInsets.only(right: 14),
                            child: Row(
                              children: [
                                Icon(Icons.arrow_forward_ios_rounded,
                                    size: 11, color: Colors.grey[400]),
                                Icon(Icons.arrow_forward_ios_rounded,
                                    size: 11, color: Colors.grey[500]),
                                Icon(Icons.arrow_forward_ios_rounded,
                                    size: 11, color: Colors.grey[700]),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
