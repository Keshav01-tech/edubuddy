# EduBuddy Mobile - Flutter Learning App

Ek high-end, pixel-perfect Flutter mobile application jo modern pastel design system, smooth interactions aur authentic EdTech UI/UX ke sath build ki gayi hai.

## 📱 Features & Screens

1. **Screen 1: Welcome & Onboarding (`OnboardingScreen`)**
   - Layered pastel arch graphics (Mint, Peach, Slate rings)
   - Student portrait visual with orange notebook accent
   - Bottom sheet container with curved top radius
   - Interactive slide/continue action pill with checkmark & chevrons

2. **Screen 2: Student Dashboard (`HomeDashboardScreen`)**
   - Stylized custom header (drawer menu + profile avatar)
   - **Today Class Hero Card**: Soft mint-to-cream gradient, live status indicator, "Creative Sketching" class, step progress bar, circular play button, and 3D stationery graphic
   - **Class Schedule Strip**: Horizontal scrollable date picker (Sun 17 active dark pill with task indicator dots, Mon-Sat)
   - **Timeline Section**: Vertical hourly schedule (8:00, 10:00, 12:00) with subject chips (Writing, Math, Chemistry, Developing)
   - **Floating Curved Bottom Dock**: Rounded navigation bar with active dark pill ("Home"), Analytics, Chat, and Profile

3. **Screen 3: Today's Class & Subject Details (`ClassDetailScreen`)**
   - Circular back button & top bar
   - **Hero Class Card**: Blush rose pastel gradient, checkmark time pill ("12 PM - 03 AM"), "History of Physics", "16 Aug" / "Intensive" tags, Professor Aalvina Fatehi info, chalkboard & teacher visual
   - **Last Lessons List**: History, Geometry, Physics, Biology, and Math lesson cards with custom pastel badges, classmate stacked avatars (+5), dates, and duration

---

## 🚀 How to Run the App

### 1. Run on macOS Desktop:
```bash
cd edubuddy_mobile
flutter run -d macos
```

### 2. Run on iOS Simulator (iPhone):
```bash
open -a Simulator
cd edubuddy_mobile
flutter run -d iPhone
```

### 3. Run on Chrome / Web:
```bash
cd edubuddy_mobile
flutter run -d chrome
```

### 4. Run Tests & Linter:
```bash
cd edubuddy_mobile
flutter test
flutter analyze
```

---

## 📂 Project Architecture

```
edubuddy_mobile/
├── lib/
│   ├── main.dart
│   ├── theme/
│   │   └── app_theme.dart               # Colors, Typography (Plus Jakarta Sans), Radius
│   ├── models/
│   │   ├── lesson_model.dart            # Last lessons data model
│   │   └── timeline_event_model.dart    # Daily timeline slot model
│   ├── screens/
│   │   ├── onboarding_screen.dart       # Screen 1
│   │   ├── home_dashboard_screen.dart   # Screen 2
│   │   └── class_detail_screen.dart     # Screen 3
│   └── widgets/
│       ├── custom_curved_bottom_bar.dart
│       ├── schedule_calendar_strip.dart
│       ├── today_class_hero_card.dart
│       ├── timeline_section.dart
│       ├── lesson_list_item.dart
│       └── custom_illustrations.dart    # Custom vector graphics & 3D art
└── test/
    └── widget_test.dart                 # Automated widget smoke tests
```
