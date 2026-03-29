package com.sliit.studyhub.controller;

import com.sliit.studyhub.model.ConnectionRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Criteria;

@RestController
@RequestMapping("/api/connections")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ConnectionController {
    private final MongoTemplate mongoTemplate;

    @PostMapping("/request")
    public ConnectionRequest requestConnection(@RequestParam String toStudentId, @AuthenticationPrincipal UserDetails user) {
        // Prevent duplicate connection requests
        Query query = new Query();
        query.addCriteria(
            new Criteria().orOperator(
                Criteria.where("fromStudentId").is(user.getUsername()).and("toStudentId").is(toStudentId),
                Criteria.where("fromStudentId").is(toStudentId).and("toStudentId").is(user.getUsername())
            )
        );
        if (mongoTemplate.count(query, ConnectionRequest.class) > 0) {
            throw new RuntimeException("A connection request already exists between these users.");
        }

        ConnectionRequest req = new ConnectionRequest();
        req.setFromStudentId(user.getUsername());
        req.setToStudentId(toStudentId);
        return mongoTemplate.save(req);
    }

    @GetMapping("/sent")
    public java.util.List<ConnectionRequest> getSent(@AuthenticationPrincipal UserDetails user) {
        Query query = new Query();
        query.addCriteria(Criteria.where("fromStudentId").is(user.getUsername()).and("status").is("PENDING"));
        return mongoTemplate.find(query, ConnectionRequest.class);
    }

    @PutMapping("/{id}/accept")
    public ConnectionRequest acceptConnection(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
        ConnectionRequest req = mongoTemplate.findById(id, ConnectionRequest.class);
        if (req != null && req.getToStudentId().equals(user.getUsername())) {
            req.setStatus("ACCEPTED");
            mongoTemplate.save(req);
        }
        return req;
    }

    @DeleteMapping("/{id}/reject")
    public void rejectConnection(@PathVariable String id, @AuthenticationPrincipal UserDetails user) {
        ConnectionRequest req = mongoTemplate.findById(id, ConnectionRequest.class);
        if (req != null && req.getToStudentId().equals(user.getUsername())) {
            req.setStatus("REJECTED");
            mongoTemplate.save(req);
        }
    }

    @GetMapping("/pending")
    public java.util.List<ConnectionRequest> getPending(@AuthenticationPrincipal UserDetails user) {
        Query query = new Query();
        query.addCriteria(Criteria.where("toStudentId").is(user.getUsername()).and("status").is("PENDING"));
        return mongoTemplate.find(query, ConnectionRequest.class);
    }

    @GetMapping("/accepted")
    public java.util.List<ConnectionRequest> getAccepted(@AuthenticationPrincipal UserDetails user) {
        Query query = new Query();
        query.addCriteria(
            new Criteria().andOperator(
                Criteria.where("status").is("ACCEPTED"),
                new Criteria().orOperator(
                    Criteria.where("fromStudentId").is(user.getUsername()),
                    Criteria.where("toStudentId").is(user.getUsername())
                )
            )
        );
        return mongoTemplate.find(query, ConnectionRequest.class);
    }
}
