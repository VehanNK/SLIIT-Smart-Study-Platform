package com.sliit.studyhub.service;

import com.sliit.studyhub.model.StudySession;
import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.repository.StudentRepository;
import com.sliit.studyhub.repository.StudySessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;

@Service
@RequiredArgsConstructor
public class SessionReminderTask {

    private final StudySessionRepository sessionRepository;
    private final StudentRepository studentRepository;
    // Note: Mocking JavaMailSender behavior to prevent crash if bean not configured
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private JavaMailSender mailSender;

    @Scheduled(fixedRate = 900000) // 15 minutes = 900,000 ms
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowEnd = now.plusMinutes(16); // Buffer to catch sessions starting exactly in 15 min
        
        List<StudySession> upcomingSessions = sessionRepository.findByStartTimeBetween(now, windowEnd);
        
        for (StudySession session : upcomingSessions) {
            if (session.getAttendees() != null) {
                for (String studentId : session.getAttendees()) {
                    studentRepository.findByStudentId(studentId).ifPresent(student -> {
                        if (student.isReminderEnabled() && student.getEmail() != null) {
                            String body = buildEmailBody(session);
                            sendEmail(student.getEmail(), "⏰ Reminder: " + session.getTitle() + " starts in 15 minutes", body);
                        }
                    });
                }
            }
        }
    }

    private void sendEmail(String to, String subject, String text) {
        if (mailSender == null) {
            System.out.println("No JavaMailSender configured. Mocking email to " + to + " - " + subject);
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    private String buildEmailBody(StudySession session) {
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("EEE, d MMM yyyy 'at' HH:mm");
        StringBuilder sb = new StringBuilder();
        sb.append("Hello,\n\n");
        sb.append("Your study session is starting in 15 minutes!\n\n");
        sb.append("Session: ").append(session.getTitle()).append("\n");
        if (session.getStartTime() != null) {
            sb.append("Start:   ").append(session.getStartTime().format(fmt)).append("\n");
        }
        if (session.getEndTime() != null) {
            sb.append("End:     ").append(session.getEndTime().format(fmt)).append("\n");
        }
        if (session.getMeetingLink() != null) {
            sb.append("Link:    ").append(session.getMeetingLink()).append("\n");
        }
        sb.append("\n--- Add to Your Calendar ---\n");
        sb.append(generateIcs(session));
        sb.append("\nSee you there!\nSLIIT StudyHub");
        return sb.toString();
    }

    private String generateIcs(StudySession session) {
        DateTimeFormatter icsFmt = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");
        String uid = (session.getId() != null ? session.getId() : "unknown") + "@studyhub.sliit.lk";
        String dtStart = session.getStartTime() != null ? session.getStartTime().format(icsFmt) : "";
        String dtEnd = session.getEndTime() != null ? session.getEndTime().format(icsFmt)
                : (session.getStartTime() != null ? session.getStartTime().plusHours(1).format(icsFmt) : "");
        String summary = session.getTitle() != null ? session.getTitle() : "Study Session";
        String location = session.getMeetingLink() != null ? session.getMeetingLink() : "";

        return "BEGIN:VCALENDAR\r\n" +
               "VERSION:2.0\r\n" +
               "PRODID:-//SLIIT StudyHub//EN\r\n" +
               "BEGIN:VEVENT\r\n" +
               "UID:" + uid + "\r\n" +
               "DTSTART:" + dtStart + "\r\n" +
               "DTEND:" + dtEnd + "\r\n" +
               "SUMMARY:" + summary + "\r\n" +
               "LOCATION:" + location + "\r\n" +
               "DESCRIPTION:Study session scheduled via SLIIT StudyHub\r\n" +
               "END:VEVENT\r\n" +
               "END:VCALENDAR\r\n";
    }
}
