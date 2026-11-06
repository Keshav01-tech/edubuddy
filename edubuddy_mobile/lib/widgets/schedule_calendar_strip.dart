import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class ScheduleCalendarStrip extends StatefulWidget {
  final Function(int) onDaySelected;

  const ScheduleCalendarStrip({
    super.key,
    required this.onDaySelected,
  });

  @override
  State<ScheduleCalendarStrip> createState() => _ScheduleCalendarStripState();
}

class _ScheduleCalendarStripState extends State<ScheduleCalendarStrip> {
  int _selectedDayIndex = 0; // Default: Sun 17

  final List<Map<String, dynamic>> _days = [
    {'day': 'Sun', 'date': '17', 'hasTasks': true, 'dotCount': 4},
    {'day': 'Mon', 'date': '18', 'hasTasks': true, 'dotCount': 2},
    {'day': 'Tue', 'date': '19', 'hasTasks': true, 'dotCount': 1},
    {'day': 'Wed', 'date': '20', 'hasTasks': true, 'dotCount': 3},
    {'day': 'Thu', 'date': '21', 'hasTasks': false, 'dotCount': 0},
    {'day': 'Fri', 'date': '22', 'hasTasks': true, 'dotCount': 2},
    {'day': 'Sat', 'date': '23', 'hasTasks': false, 'dotCount': 0},
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header with Month Dropdown
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Class Schedule',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.3,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Jan 2026',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(
                      Icons.keyboard_arrow_down_rounded,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // Horizontal Days List
        SizedBox(
          height: 78,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            scrollDirection: Axis.horizontal,
            itemCount: _days.length,
            separatorBuilder: (context, index) => const SizedBox(width: 8),
            itemBuilder: (context, index) {
              final item = _days[index];
              final isSelected = _selectedDayIndex == index;

              return GestureDetector(
                onTap: () {
                  setState(() => _selectedDayIndex = index);
                  widget.onDaySelected(index);
                },
                behavior: HitTestBehavior.opaque,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 46,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.darkPill : Colors.white,
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(
                      color: isSelected
                          ? AppColors.darkPill
                          : const Color(0xFFE2E8F0).withValues(alpha: 0.7),
                      width: 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: AppColors.darkPill.withValues(alpha: 0.25),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Day name
                      Text(
                        item['day'],
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isSelected
                              ? Colors.white.withValues(alpha: 0.7)
                              : AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 3),

                      // Date number
                      Text(
                        item['date'],
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Scheduled task dots
                      if (isSelected)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(
                            item['dotCount'] > 0 ? item['dotCount'] : 3,
                            (i) => Container(
                              margin: const EdgeInsets.symmetric(horizontal: 1),
                              width: 3,
                              height: 3,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                            ),
                          ),
                        )
                      else if (item['hasTasks'])
                        Container(
                          width: 3.5,
                          height: 3.5,
                          decoration: BoxDecoration(
                            color: Colors.grey.withValues(alpha: 0.5),
                            shape: BoxShape.circle,
                          ),
                        )
                      else
                        const SizedBox(height: 3.5),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
