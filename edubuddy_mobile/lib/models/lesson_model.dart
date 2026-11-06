import 'package:flutter/material.dart';

class LessonModel {
  final String title;
  final String time;
  final String date;
  final String duration;
  final IconData icon;
  final Color iconBgColor;
  final Color iconColor;
  final int classmateCount;
  final List<String> classmateInitials;

  const LessonModel({
    required this.title,
    required this.time,
    required this.date,
    required this.duration,
    required this.icon,
    required this.iconBgColor,
    required this.iconColor,
    this.classmateCount = 5,
    this.classmateInitials = const ['AK', 'SP', 'RV'],
  });

  static List<LessonModel> getSampleLessons() {
    return const [
      LessonModel(
        title: 'History',
        time: '09:00 PM',
        date: '16 Aug',
        duration: '12:00-3:00 PM',
        icon: Icons.history_rounded,
        iconBgColor: Color(0xFFEFF6FF),
        iconColor: Color(0xFF2563EB),
        classmateCount: 5,
        classmateInitials: ['JD', 'EM', 'RL'],
      ),
      LessonModel(
        title: 'Geometry',
        time: '08:00 PM',
        date: '16 Aug',
        duration: '12:00-3:00 PM',
        icon: Icons.architecture_rounded,
        iconBgColor: Color(0xFFECFEFF),
        iconColor: Color(0xFF0891B2),
        classmateCount: 5,
        classmateInitials: ['AM', 'PS', 'TN'],
      ),
      LessonModel(
        title: 'Physics',
        time: '09:00 PM',
        date: '16 Aug',
        duration: '12:00-3:00 PM',
        icon: Icons.blur_circular_rounded,
        iconBgColor: Color(0xFFEFF6FF),
        iconColor: Color(0xFF3B82F6),
        classmateCount: 5,
        classmateInitials: ['VR', 'KP', 'SK'],
      ),
      LessonModel(
        title: 'Biology',
        time: '09:00 PM',
        date: '16 Aug',
        duration: '12:00-3:00 PM',
        icon: Icons.coronavirus_outlined,
        iconBgColor: Color(0xFFF0FDF4),
        iconColor: Color(0xFF059669),
        classmateCount: 5,
        classmateInitials: ['NB', 'MS', 'AK'],
      ),
      LessonModel(
        title: 'Math',
        time: '09:00 PM',
        date: '16 Aug',
        duration: '12:00-3:00 PM',
        icon: Icons.calculate_outlined,
        iconBgColor: Color(0xFFFAF5FF),
        iconColor: Color(0xFF9333EA),
        classmateCount: 5,
        classmateInitials: ['DR', 'SM', 'TP'],
      ),
    ];
  }
}
