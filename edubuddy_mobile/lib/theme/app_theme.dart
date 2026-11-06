import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  // Base backgrounds
  static const Color background = Color(0xFFF7F8FA);
  static const Color cardWhite = Color(0xFFFFFFFF);
  static const Color cardBorder = Color(0xFFF0F2F5);

  // Typography
  static const Color textPrimary = Color(0xFF1E2432);
  static const Color textSecondary = Color(0xFF7C8BA0);
  static const Color textMuted = Color(0xFFA0AEC0);

  // Dark elements (Pills, active icons, primary buttons)
  static const Color darkPill = Color(0xFF1E2432);
  static const Color darkPillHover = Color(0xFF2C3446);

  // Pastels & Hero Gradients
  static const Color mintLight = Color(0xFFD6F3E4);
  static const Color mintCardEnd = Color(0xFFFDF6EA);
  
  static const Color roseLight = Color(0xFFFFE0E6);
  static const Color roseCardEnd = Color(0xFFFFF2F5);

  static const Color peachLight = Color(0xFFFFE6D5);
  static const Color purpleLight = Color(0xFFEFE6FD);
  static const Color skyLight = Color(0xFFE2F0FE);
  static const Color amberLight = Color(0xFFFEF3C7);

  // Accents & Badges
  static const Color liveGreen = Color(0xFF10B981);
  static const Color liveGreenBg = Color(0xFFD1FAE5);
  static const Color accentBlue = Color(0xFF2563EB);
  static const Color accentPurple = Color(0xFF7C3AED);
  static const Color accentOrange = Color(0xFFF97316);
  static const Color accentPink = Color(0xFFEC4899);
}

class AppTheme {
  static ThemeData get lightTheme {
    final baseTextTheme = GoogleFonts.plusJakartaSansTextTheme();

    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.darkPill,
        primary: AppColors.darkPill,
        surface: AppColors.cardWhite,
      ),
      textTheme: baseTextTheme.copyWith(
        displayLarge: GoogleFonts.plusJakartaSans(
          fontSize: 32,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.5,
        ),
        headlineLarge: GoogleFonts.plusJakartaSans(
          fontSize: 26,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.5,
        ),
        headlineMedium: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
          letterSpacing: -0.3,
        ),
        titleLarge: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
        titleMedium: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          fontWeight: FontWeight.w600,
          color: AppColors.textPrimary,
        ),
        bodyLarge: GoogleFonts.plusJakartaSans(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
        bodyMedium: GoogleFonts.plusJakartaSans(
          fontSize: 13,
          fontWeight: FontWeight.w400,
          color: AppColors.textSecondary,
        ),
        labelSmall: GoogleFonts.plusJakartaSans(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
