package com.sliit.studyhub.service;

import org.springframework.stereotype.Service;
import java.util.UUID;

public interface MeetingProviderService {
    String generateMeetingLink(String title);
}
