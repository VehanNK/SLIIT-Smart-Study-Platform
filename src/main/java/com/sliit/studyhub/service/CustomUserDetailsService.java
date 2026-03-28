package com.sliit.studyhub.service;

import com.sliit.studyhub.model.Student;
import com.sliit.studyhub.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final StudentRepository studentRepository;
    
    @Override
    public UserDetails loadUserByUsername(String studentId) throws UsernameNotFoundException {
        Student student = studentRepository.findByStudentId(studentId)
                .orElseThrow(() -> new UsernameNotFoundException("Student not found: " + studentId));
        return new User(student.getStudentId(), student.getPassword(), new ArrayList<>());
    }
}