package com.sliit.studyhub.service;

import org.springframework.stereotype.Service;

@Service
public class GoogleMeetService implements MeetingProviderService {
    @Override
    public String generateMeetingLink(String title) {
        String code = java.util.UUID.randomUUID().toString().substring(0, 10).replace("-", "");
        return "https://meet.google.com/" + code.substring(0, 3) + "-" + code.substring(3, 7) + "-" + code.substring(7);
    }
}
