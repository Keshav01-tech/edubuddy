import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class CustomCurvedBottomBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onTabSelected;

  const CustomCurvedBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onTabSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(left: 24, right: 24, bottom: 24),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(36),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 4,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Tab 0: Dashboard (Home)
          _buildTabItem(
            index: 0,
            icon: Icons.dashboard_rounded,
            label: 'Home',
          ),

          // Tab 1: Haziri (Attendance)
          _buildTabItem(
            index: 1,
            icon: Icons.how_to_reg_rounded,
            label: 'Haziri',
          ),

          // Tab 2: Fees (Collections & GST)
          _buildTabItem(
            index: 2,
            icon: Icons.account_balance_wallet_rounded,
            label: 'Fees',
          ),

          // Tab 3: Tests (NCERT Maker)
          _buildTabItem(
            index: 3,
            icon: Icons.description_rounded,
            label: 'Tests',
          ),
        ],
      ),
    );
  }

  Widget _buildTabItem({
    required int index,
    required IconData icon,
    required String label,
  }) {
    final isSelected = selectedIndex == index;

    return GestureDetector(
      onTap: () => onTabSelected(index),
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOutCubic,
        padding: EdgeInsets.symmetric(
          horizontal: isSelected ? 16 : 14,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.darkPill : Colors.transparent,
          borderRadius: BorderRadius.circular(24),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            if (isSelected) ...[
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
