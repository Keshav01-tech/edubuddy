import 'package:flutter/material.dart';

/// Coaching Batch Model
class BatchModel {
  final String id;
  final String name;
  final String timing;
  final String room;
  final int totalStudents;
  final int presentCount;
  final Color badgeColor;

  const BatchModel({
    required this.id,
    required this.name,
    required this.timing,
    required this.room,
    required this.totalStudents,
    required this.presentCount,
    required this.badgeColor,
  });

  static List<BatchModel> getBatches() {
    return const [
      BatchModel(
        id: 'b1',
        name: 'Class 10 Foundation',
        timing: '09:00 AM - 11:00 AM',
        room: 'Hall A',
        totalStudents: 48,
        presentCount: 46,
        badgeColor: Color(0xFF10B981),
      ),
      BatchModel(
        id: 'b2',
        name: 'Class 11 Science (PCM)',
        timing: '11:30 AM - 01:30 PM',
        room: 'Lab 2',
        totalStudents: 42,
        presentCount: 40,
        badgeColor: Color(0xFF2563EB),
      ),
      BatchModel(
        id: 'b3',
        name: 'Class 12 Board Sprint',
        timing: '02:00 PM - 04:00 PM',
        room: 'Room 101',
        totalStudents: 38,
        presentCount: 35,
        badgeColor: Color(0xFF7C3AED),
      ),
      BatchModel(
        id: 'b4',
        name: 'NEET Medical Target',
        timing: '04:30 PM - 06:30 PM',
        room: 'Hall B',
        totalStudents: 50,
        presentCount: 49,
        badgeColor: Color(0xFFEA580C),
      ),
      BatchModel(
        id: 'b5',
        name: 'JEE Advanced Morning',
        timing: '07:00 AM - 08:45 AM',
        room: 'Room 204',
        totalStudents: 32,
        presentCount: 32,
        badgeColor: Color(0xFF059669),
      ),
    ];
  }
}

/// Student Roster Model
class StudentRosterModel {
  final String id;
  final String rollNo;
  final String name;
  final String parentName;
  final String phone;
  final String batch;
  final String attendance; // 'P' or 'A'
  final String attendanceRate;
  final bool waAlertSent;

  const StudentRosterModel({
    required this.id,
    required this.rollNo,
    required this.name,
    required this.parentName,
    required this.phone,
    required this.batch,
    required this.attendance,
    required this.attendanceRate,
    this.waAlertSent = false,
  });

  static List<StudentRosterModel> getClass10Students() {
    return const [
      StudentRosterModel(
        id: 's1',
        rollNo: 'Roll #01',
        name: 'Kartik Pandey',
        parentName: 'Mr. Rajesh Verma',
        phone: '98290-XXXXX',
        batch: 'Class 10 Foundation',
        attendance: 'P',
        attendanceRate: '100% Monthly',
        waAlertSent: false,
      ),
      StudentRosterModel(
        id: 's2',
        rollNo: 'Roll #03',
        name: 'Aman Verma',
        parentName: 'Mr. Suresh Verma',
        phone: '98291-XXXXX',
        batch: 'Class 10 Foundation',
        attendance: 'A',
        attendanceRate: 'WA Alert Sent 09:02',
        waAlertSent: true,
      ),
      StudentRosterModel(
        id: 's3',
        rollNo: 'Roll #04',
        name: 'Rohan Mehra',
        parentName: 'Mr. Deepak Mehra',
        phone: '98292-XXXXX',
        batch: 'Class 10 Foundation',
        attendance: 'P',
        attendanceRate: '96% Haziri',
        waAlertSent: false,
      ),
      StudentRosterModel(
        id: 's4',
        rollNo: 'Roll #07',
        name: 'Priya Sharma',
        parentName: 'Mrs. Sunita Sharma',
        phone: '98293-XXXXX',
        batch: 'Class 10 Foundation',
        attendance: 'P',
        attendanceRate: '98% Haziri',
        waAlertSent: false,
      ),
      StudentRosterModel(
        id: 's5',
        rollNo: 'Roll #12',
        name: 'Devansh Saxena',
        parentName: 'Mr. Alok Saxena',
        phone: '98294-XXXXX',
        batch: 'Class 10 Foundation',
        attendance: 'A',
        attendanceRate: 'WA Alert Sent 09:02',
        waAlertSent: true,
      ),
    ];
  }
}

/// Today's Coaching Timetable Slot
class LectureScheduleModel {
  final String time;
  final String batch;
  final String subject;
  final String topic;
  final String teacher;
  final Color iconBg;
  final Color iconColor;
  final IconData icon;

  const LectureScheduleModel({
    required this.time,
    required this.batch,
    required this.subject,
    required this.topic,
    required this.teacher,
    required this.iconBg,
    required this.iconColor,
    required this.icon,
  });

  static List<LectureScheduleModel> getTodayLectures() {
    return const [
      LectureScheduleModel(
        time: '09:00 AM',
        batch: 'Class 10 Foundation',
        subject: 'Mathematics',
        topic: 'Arithmetic Progressions (NCERT Ex 5.3)',
        teacher: 'Sharma Sir',
        iconBg: Color(0xFFDCFCE7),
        iconColor: Color(0xFF16A34A),
        icon: Icons.functions_rounded,
      ),
      LectureScheduleModel(
        time: '11:30 AM',
        batch: 'Class 11 Science',
        subject: 'Physics',
        topic: 'Laws of Motion & Friction Numericals',
        teacher: 'Verma Sir',
        iconBg: Color(0xFFEFF6FF),
        iconColor: Color(0xFF2563EB),
        icon: Icons.blur_circular_rounded,
      ),
      LectureScheduleModel(
        time: '02:00 PM',
        batch: 'Class 12 Boards',
        subject: 'Chemistry',
        topic: 'Electrochemistry Formula Sheet Discussion',
        teacher: 'Gupta Ma’am',
        iconBg: Color(0xFFFFEDD5),
        iconColor: Color(0xFFEA580C),
        icon: Icons.science_outlined,
      ),
      LectureScheduleModel(
        time: '04:30 PM',
        batch: 'NEET Target',
        subject: 'Biology',
        topic: 'Cell Division (Meiosis Stage II)',
        teacher: 'Dr. Mukherjee',
        iconBg: Color(0xFFF3E8FF),
        iconColor: Color(0xFF9333EA),
        icon: Icons.coronavirus_outlined,
      ),
    ];
  }
}

/// Fee Record / Invoice Model
class FeeInvoiceModel {
  final String invoiceNo;
  final String studentName;
  final String course;
  final String date;
  final double tuitionFee;
  final double examFee;
  final double totalAmount;
  final String status; // 'Paid', 'Pending', 'Overdue'
  final String upiRef;
  final String parentWhatsApp;

  const FeeInvoiceModel({
    required this.invoiceNo,
    required this.studentName,
    required this.course,
    required this.date,
    required this.tuitionFee,
    required this.examFee,
    required this.totalAmount,
    required this.status,
    required this.upiRef,
    required this.parentWhatsApp,
  });

  static List<FeeInvoiceModel> getSampleInvoices() {
    return const [
      FeeInvoiceModel(
        invoiceNo: 'BFIT/2026/1048',
        studentName: 'Aditya Paswan',
        course: 'BCA 1st Year (BFIT20260124)',
        date: '25 Oct 2026',
        tuitionFee: 35000.0,
        examFee: 7000.0,
        totalAmount: 42000.0,
        status: 'Paid',
        upiRef: 'bfit@hdfcbank · HDFC 50201234567890',
        parentWhatsApp: 'Delivered via WhatsApp',
      ),
      FeeInvoiceModel(
        invoiceNo: 'BFIT/2026/1049',
        studentName: 'Kartik Pandey',
        course: 'Class 10 Foundation (Batch A)',
        date: '01 Nov 2026',
        tuitionFee: 12000.0,
        examFee: 1500.0,
        totalAmount: 13500.0,
        status: 'Paid',
        upiRef: 'UPI-WA-98290X',
        parentWhatsApp: 'Delivered via WhatsApp',
      ),
      FeeInvoiceModel(
        invoiceNo: 'BFIT/2026/1050',
        studentName: 'Aman Verma',
        course: 'Class 10 Foundation (Batch A)',
        date: '28 Oct 2026',
        tuitionFee: 12000.0,
        examFee: 1500.0,
        totalAmount: 13500.0,
        status: 'Pending',
        upiRef: 'Pending Payment',
        parentWhatsApp: 'Follow-up Due Today',
      ),
      FeeInvoiceModel(
        invoiceNo: 'BFIT/2026/1051',
        studentName: 'Rohan Mehra',
        course: 'Class 11 Science (PCM)',
        date: '20 Oct 2026',
        tuitionFee: 18000.0,
        examFee: 2000.0,
        totalAmount: 20000.0,
        status: 'Pending',
        upiRef: 'Pending Payment',
        parentWhatsApp: 'WhatsApp Reminder Scheduled',
      ),
    ];
  }
}

/// Admission CRM Lead Model
class LeadCRMModel {
  final String name;
  final String targetClass;
  final String phone;
  final String status; // 'Demo Booked', 'High Intent', 'Walk-in'
  final String note;
  final String timing;

  const LeadCRMModel({
    required this.name,
    required this.targetClass,
    required this.phone,
    required this.status,
    required this.note,
    required this.timing,
  });

  static List<LeadCRMModel> getSampleLeads() {
    return const [
      LeadCRMModel(
        name: 'Rohan Gupta',
        targetClass: 'Class 11 Science · Tonk Road',
        phone: '+91 98290-XXXXX',
        status: 'Demo Booked',
        note: 'Interested in Physics & Maths batch',
        timing: 'Trial: Tuesday 4:30 PM',
      ),
      LeadCRMModel(
        name: 'Ananya Sen',
        targetClass: 'Class 10 Foundation · NEET Target',
        phone: '+91 98291-XXXXX',
        status: 'High Intent',
        note: 'Walk-in inquiry · Fee discussion scheduled tomorrow',
        timing: 'Walk-in · 11:00 AM',
      ),
      LeadCRMModel(
        name: 'Sameer Khan',
        targetClass: 'Class 12 Board Sprint',
        phone: '+91 98292-XXXXX',
        status: 'Follow-up Due',
        note: 'Requested last year board test sample',
        timing: 'Call scheduled today',
      ),
    ];
  }
}

/// NCERT Test Question Model
class TestQuestionModel {
  final String qNum;
  final String marks;
  final String question;
  final String answer;

  const TestQuestionModel({
    required this.qNum,
    required this.marks,
    required this.question,
    required this.answer,
  });
}
