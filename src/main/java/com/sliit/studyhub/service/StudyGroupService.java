package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.model.StudyGroup;
import com.sliit.studyhub.repository.StudyGroupRepository;
import com.sliit.studyhub.util.StudentIdParser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class StudyGroupService {
    private final StudyGroupRepository groupRepository;
    private final StudentIdParser idParser;
    private final StudentService studentService;

    // -----------------------------------------------------------------------
    // Core operations
    // -----------------------------------------------------------------------

    public StudyGroup createGroup(StudyGroup group, String creatorStudentId) {
        group.setCreatedBy(creatorStudentId);
        if (group.getAdmins() == null)    group.setAdmins(new ArrayList<>());
        if (group.getMembers() == null)   group.setMembers(new ArrayList<>());
        if (group.getResources() == null) group.setResources(new ArrayList<>());
        group.getAdmins().add(creatorStudentId);
        group.getMembers().add(creatorStudentId);
        return groupRepository.save(group);
    }

    public StudyGroup joinGroup(String groupId, String studentId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        var parsed = idParser.parse(studentId);
        Student student = studentService.findByStudentId(studentId);

        String targetProgram = group.getTargetProgram();
        if (targetProgram != null && !targetProgram.isBlank()
                && !"ALL".equalsIgnoreCase(targetProgram)
                && !targetProgram.equalsIgnoreCase(parsed.program)) {
            throw new RuntimeException(
                String.format("Cannot join: this group is restricted to %s students. You are enrolled in %s.", 
                    targetProgram, parsed.program)
            );
        }
        
        if (group.getYear() > 0 && group.getYear() != student.getCurrentYear()) {
            throw new RuntimeException(
                String.format("Cannot join: group is for Year %d. You are in Year %d.", 
                    group.getYear(), student.getCurrentYear())
            );
        }

        if (group.getSemester() > 0 && group.getSemester() != student.getCurrentSemester()) {
            throw new RuntimeException(
                String.format("Cannot join: group is for Semester %d. You are in Semester %d.", 
                    group.getSemester(), student.getCurrentSemester())
            );
        }

        if (group.getModuleCode() != null && !group.getModuleCode().isBlank()) {
            String groupModule = group.getModuleCode().trim().toUpperCase();
            boolean enrolled = student.getCurrentModules() != null &&
                    student.getCurrentModules().stream().anyMatch(m -> m != null && m.trim().equalsIgnoreCase(groupModule));
            if (!enrolled) {
                throw new RuntimeException(
                    String.format("Cannot join: you are not currently enrolled in module %s.", groupModule)
                );
            }
        }

        if (group.getMembers() == null) group.setMembers(new ArrayList<>());
        if (!group.getMembers().contains(studentId)) {
            group.getMembers().add(studentId);
        }
        return groupRepository.save(group);
    }

    // -----------------------------------------------------------------------
    // Task 5 — Leave group
    // -----------------------------------------------------------------------

    public StudyGroup leaveGroup(String groupId, String studentId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        // Creator/sole-admin cannot leave — they must transfer ownership first
        if (studentId.equals(group.getCreatedBy()) &&
                group.getAdmins() != null && group.getAdmins().size() == 1) {
            throw new RuntimeException(
                "You are the only admin. Transfer admin rights before leaving the group."
            );
        }

        if (group.getMembers() != null) group.getMembers().remove(studentId);
        if (group.getAdmins() != null)  group.getAdmins().remove(studentId);

        return groupRepository.save(group);
    }

    // -----------------------------------------------------------------------
    // Task 5 — Remove a member (admin only)
    // -----------------------------------------------------------------------

    public StudyGroup removeMember(String groupId, String adminStudentId, String targetStudentId) {
        StudyGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found: " + groupId));

        if (group.getAdmins() == null || !group.getAdmins().contains(adminStudentId)) {
            throw new RuntimeException("Only group admins can remove members");
        }

        if (targetStudentId.equals(group.getCreatedBy())) {
            throw new RuntimeException("The group creator cannot be removed");
        }

        if (group.getMembers() != null) group.getMembers().remove(targetStudentId);
        if (group.getAdmins() != null)  group.getAdmins().remove(targetStudentId);

        return groupRepository.save(group);
    }

    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------

    public List<StudyGroup> getAllGroups() {
        return groupRepository.findAll();
    }

    public StudyGroup getGroupById(String groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));
    }

    public StudyGroup addAnnouncement(String groupId, String text, String authorId) {
        StudyGroup group = getGroupById(groupId);
        if (group.getAdmins() == null || !group.getAdmins().contains(authorId)) {
            // Alternatively allow any member. Let's restrict to admins or members.
            // Actually, any member can post based on the UI.
            if (group.getMembers() == null || !group.getMembers().contains(authorId)) {
                throw new RuntimeException("Must be a group member to post an announcement");
            }
        }
        if (group.getAnnouncements() == null) {
            group.setAnnouncements(new ArrayList<>());
        }
        group.getAnnouncements().add(new StudyGroup.Announcement(text, authorId));
        return groupRepository.save(group);
    }

    public List<StudyGroup> getMyGroups(String studentId) {
        return groupRepository.findByMembersContaining(studentId);
    }

    /**
     * Stage 3: Smart scrored group suggestions
     */
    public List<StudyGroup> suggestGroups(String studentId) {
        Student student = studentService.findByStudentId(studentId);

        List<StudyGroup> programGroups = groupRepository.findByTargetProgramAndYear(
                student.getProgram(), student.getCurrentYear()
        );
        List<StudyGroup> allGroups = groupRepository.findByTargetProgramAndYear(
                "ALL", student.getCurrentYear()
        );

        return Stream.concat(programGroups.stream(), allGroups.stream())
                .distinct()
                .filter(g -> g.getMembers() == null || !g.getMembers().contains(studentId))
                .sorted((g1, g2) -> Integer.compare(calculateGroupScore(g2, student), calculateGroupScore(g1, student)))
                .limit(5)
                .toList();
    }

    private int calculateGroupScore(StudyGroup group, Student student) {
        int score = 0;
        if (student.getCurrentModules() != null && group.getModuleCode() != null 
                && student.getCurrentModules().contains(group.getModuleCode())) {
            score += 10;
        }
        if (group.getYear() == student.getCurrentYear()) {
            score += 5;
        }
        if (group.getMembers() != null && group.getMembers().size() >= 5) {
            score += 3;
        }
        if (student.getProgram().equalsIgnoreCase(group.getTargetProgram())) {
            score += 2;
        }
        return score;
    }

    // -----------------------------------------------------------------------
    // Stage 2: Member 1 additions
    // -----------------------------------------------------------------------

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.data.mongodb.core.MongoTemplate mongoTemplate;

    public List<Student> getSuggestedModerators(String groupId, String requesterStudentId) {
        StudyGroup group = getGroupById(groupId);
        if (group.getAdmins() == null || !group.getAdmins().contains(requesterStudentId)) {
            throw new RuntimeException("Only group admins can view moderator suggestions");
        }
        if (group.getMembers() == null || group.getMembers().isEmpty()) {
            return new ArrayList<>();
        }

        var creatorParsed = idParser.parse(group.getCreatedBy());
        int creatorIntake = creatorParsed.intakeYear;

        List<Student> suggestions = new ArrayList<>();
        for (String memberId : group.getMembers()) {
            if (group.getAdmins() != null && group.getAdmins().contains(memberId)) continue;
            var memberParsed = idParser.parse(memberId);
            if (memberParsed.intakeYear < creatorIntake) {
                suggestions.add(studentService.findByStudentId(memberId));
            }
        }
        return suggestions;
    }

    public List<com.sliit.studyhub.model.Resource> getGroupFeed(String groupId) {
        StudyGroup group = getGroupById(groupId);
        if (group.getModuleCode() == null || group.getModuleCode().isBlank()) {
            return new ArrayList<>();
        }

        org.springframework.data.mongodb.core.query.Query query = new org.springframework.data.mongodb.core.query.Query();
        java.util.List<org.springframework.data.mongodb.core.query.Criteria> criteria = new java.util.ArrayList<>();
        criteria.add(org.springframework.data.mongodb.core.query.Criteria.where("moduleCode").is(group.getModuleCode()));

        if (group.getYear() > 0) {
            criteria.add(org.springframework.data.mongodb.core.query.Criteria.where("year").is(group.getYear()));
        }
        if (group.getSemester() > 0) {
            criteria.add(org.springframework.data.mongodb.core.query.Criteria.where("semester").is(group.getSemester()));
        }
        if (group.getTargetProgram() != null && !group.getTargetProgram().isBlank() && !"ALL".equalsIgnoreCase(group.getTargetProgram())) {
            criteria.add(org.springframework.data.mongodb.core.query.Criteria.where("uploaderProgram").is(group.getTargetProgram()));
        }

        query.addCriteria(new org.springframework.data.mongodb.core.query.Criteria().andOperator(
                criteria.toArray(new org.springframework.data.mongodb.core.query.Criteria[0])
        ));

        query.with(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "avgRating", "downloads"));
        query.limit(10);

        return mongoTemplate.find(query, com.sliit.studyhub.model.Resource.class);
    }

    public StudyGroup promoteModerator(String groupId, String adminStudentId, String targetStudentId) {
        StudyGroup group = getGroupById(groupId);
        if (group.getAdmins() == null || !group.getAdmins().contains(adminStudentId)) {
            throw new RuntimeException("Only group admins can promote members");
        }
        if (group.getMembers() == null || !group.getMembers().contains(targetStudentId)) {
            throw new RuntimeException("Cannot promote: target student is not a group member");
        }
        if (group.getAdmins() != null && !group.getAdmins().contains(targetStudentId)) {
            group.getAdmins().add(targetStudentId);
        }
        return groupRepository.save(group);
    }
}