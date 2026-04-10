package com.sliit.studyhub.service;

import org.springframework.stereotype.Service;

@Service
public class ZoomMeetService implements MeetingProviderService {
    @Override
    public String generateMeetingLink(String title) {
        String code = String.valueOf(10000000000L + (long)(Math.random() * 8999999999L));
        return "https://zoom.us/j/" + code;
    }
}
