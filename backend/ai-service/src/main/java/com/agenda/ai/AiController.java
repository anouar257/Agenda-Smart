package com.agenda.ai;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final OpenRouterService openRouterService;

    @Autowired
    public AiController(OpenRouterService openRouterService) {
        this.openRouterService = openRouterService;
    }

    // Health check endpoint
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "OK", "service", "ai-service", "provider", "OpenRouter/Fallback");
    }

    @PostMapping("/extract")
    public EventDto extractEvent(@RequestBody Map<String, String> request) {
        String userText = request.get("text");

        if (userText == null || userText.trim().isEmpty()) {
            EventDto empty = new EventDto();
            empty.setTitle("Empty request");
            empty.setStartDate(java.time.LocalDate.now().toString());
            empty.setCategory("WORK");
            empty.setPriority("MEDIUM");
            return empty;
        }

        System.out.println("[AI] Processing: " + userText);
        EventDto result = openRouterService.extractEvent(userText);
        System.out.println("[AI] Result: " + result);

        return result;
    }
}
