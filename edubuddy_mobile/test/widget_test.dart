import 'package:flutter_test/flutter_test.dart';
import 'package:edubuddy_mobile/main.dart';

void main() {
  testWidgets('App renders onboarding screen smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const EduBuddyMobileApp());
    expect(find.textContaining('Effortless Coaching'), findsOneWidget);
  });
}
