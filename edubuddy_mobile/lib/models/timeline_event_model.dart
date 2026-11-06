import 'package:flutter/material.dart';

class TimelineSlot {
  final String timeLabel;
  final List<TimelineItem> items;

  const TimelineSlot({
    required this.timeLabel,
    required this.items,
  });

  static List<TimelineSlot> getSampleSlots() {
    return const [
      TimelineSlot(
        timeLabel: '8:00',
        items: [
          TimelineItem(
            title: 'Writing',
            duration: '8:00-8:30',
            icon: Icons.edit_note_rounded,
            iconBg: Color(0xFFDCFCE7),
            iconColor: Color(0xFF16A34A),
          ),
          TimelineItem(
            title: 'Math',
            duration: '8:30-9:00',
            icon: Icons.functions_rounded,
            iconBg: Color(0xFFF3E8FF),
            iconColor: Color(0xFF9333EA),
          ),
        ],
      ),
      TimelineSlot(
        timeLabel: '10:00',
        items: [
          TimelineItem(
            title: 'Chemistry',
            duration: '10:00-10:30',
            icon: Icons.science_outlined,
            iconBg: Color(0xFFFFEDD5),
            iconColor: Color(0xFFEA580C),
          ),
        ],
      ),
      TimelineSlot(
        timeLabel: '12:00',
        items: [
          TimelineItem(
            title: 'Developing',
            duration: '12:00-12:30',
            icon: Icons.laptop_mac_rounded,
            iconBg: Color(0xFFE0F2FE),
            iconColor: Color(0xFF0284C7),
          ),
        ],
      ),
    ];
  }
}

class TimelineItem {
  final String title;
  final String duration;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;

  const TimelineItem({
    required this.title,
    required this.duration,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
  });
}
