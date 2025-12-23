package com.agenda.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.time.LocalDate;
import java.util.*;

@Service
public class OpenRouterService {

    @Value("${openrouter.api-key:}")
    private String apiKey;

    @Value("${openrouter.model:mistralai/mistral-7b-instruct:free}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final KafkaTemplate<String, EventDto> kafkaTemplate;

    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final String TOPIC = "ai-events-topic";

    public OpenRouterService(KafkaTemplate<String, EventDto> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public EventDto extractEvent(String userText) {
        String today = LocalDate.now().toString();
        String tomorrow = LocalDate.now().plusDays(1).toString();

        // If no API key, use fallback parsing
        if (apiKey == null || apiKey.isEmpty()) {
            System.out.println("[AI] No API key, using fallback parsing");
            return fallbackParse(userText, today);
        }

        try {
            String systemPrompt = String.format("""
                    Analyze user text and determine the action and event details. Return ONLY valid JSON:
                    {
                      "action": "CREATE" or "UPDATE" or "DELETE",
                      "title": "event title",
                      "searchTitle": "title to search for UPDATE/DELETE (null for CREATE)",
                      "startDate": "YYYY-MM-DD",
                      "startTime": "HH:mm",
                      "category": "WORK",
                      "priority": "MEDIUM"
                    }
                    
                    Rules:
                    - "modifier", "changer", "décaler", "update" -> action = UPDATE
                    - "supprimer", "annuler", "enlever", "delete", "cancel" -> action = DELETE
                    - Otherwise -> action = CREATE
                    - For UPDATE/DELETE, searchTitle = the event to find
                    
                    Today: %s, Tomorrow: %s
                    Categories: WORK, HEALTH, SPORT, SOCIAL
                    """, today, tomorrow);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userText)));
            requestBody.put("max_tokens", 150);
            requestBody.put("temperature", 0.3);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("HTTP-Referer", "http://localhost:4200");
            headers.set("X-Title", "SmartAgendaAI");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            System.out.println("[AI] Calling OpenRouter API...");
            ResponseEntity<String> response = restTemplate.postForEntity(OPENROUTER_URL, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String content = root.path("choices").path(0).path("message").path("content").asText();
                System.out.println("[AI] Response: " + content);

                // Parse JSON from response
                EventDto event = parseJsonResponse(content, today);

                // Send to Kafka
                try {
                    kafkaTemplate.send(TOPIC, event);
                } catch (Exception e) {
                    System.err.println("[AI] Kafka failed: " + e.getMessage());
                }

                return event;
            }
        } catch (Exception e) {
            System.err.println("[AI] OpenRouter error: " + e.getMessage());
            e.printStackTrace();
        }

        return fallbackParse(userText, today);
    }

    private EventDto parseJsonResponse(String content, String today) {
        try {
            // Extract JSON from response (might be wrapped in text)
            int start = content.indexOf('{');
            int end = content.lastIndexOf('}') + 1;
            if (start >= 0 && end > start) {
                String json = content.substring(start, end);
                return objectMapper.readValue(json, EventDto.class);
            }
        } catch (Exception e) {
            System.err.println("[AI] JSON parse error: " + e.getMessage());
        }
        return fallbackParse(content, today);
    }

    private EventDto fallbackParse(String text, String today) {
        EventDto event = new EventDto();
        String lower = text.toLowerCase();

        // Detect action - use contains for reliable matching
        boolean isDelete = lower.contains("suppr") || lower.contains("annul") || lower.contains("enlever")
                || lower.contains("delete") || lower.contains("cancel") || lower.contains("remove");
        boolean isUpdate = lower.contains("modif") || lower.contains("chang") || lower.contains("décal")
                || lower.contains("update") || lower.contains("edit") || lower.contains("move")
                || lower.contains("déplac") || lower.contains("report");
        
        System.out.println("[AI] Detecting action from: '" + lower + "' -> isDelete=" + isDelete + ", isUpdate=" + isUpdate);
        
        if (isDelete) {
            event.setAction("DELETE");
        } else if (isUpdate) {
            event.setAction("UPDATE");
        } else {
            event.setAction("CREATE");
        }

        // Extract title - look for key nouns (skip action words and common words)
        String[] words = text.split("\\s+");
        String foundTitle = null;
        for (String word : words) {
            String w = word.toLowerCase();
            // Skip action words and common words - use regex pattern
            if (w.matches("(suppr.*|annul.*|modif.*|chang.*|décal.*|déplac.*|report.*|le|la|les|l|mon|ma|mes|un|une|des|rdv|rendez-vous|rendez|vous|à|a|de|du|pour|et|en)")) {
                continue;
            }
            if (w.length() > 2) {
                foundTitle = capitalize(word);
                break;
            }
        }
        event.setTitle(foundTitle != null ? foundTitle : "Event");
        
        // For UPDATE/DELETE, set searchTitle
        if (!"CREATE".equals(event.getAction())) {
            event.setSearchTitle(event.getTitle());
        }

        // Detect date
        if (lower.contains("demain") || lower.contains("tomorrow")) {
            event.setStartDate(LocalDate.now().plusDays(1).toString());
        } else {
            event.setStartDate(today);
        }

        // Detect time (HH:mm or Hh format)
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("(\\d{1,2})[h:]?(\\d{2})?");
        java.util.regex.Matcher m = p.matcher(lower);
        if (m.find()) {
            int hour = Integer.parseInt(m.group(1));
            String min = m.group(2) != null ? m.group(2) : "00";
            event.setStartTime(String.format("%02d:%s", hour, min));
        }

        // Detect category
        if (lower.contains("sport") || lower.contains("gym") || lower.contains("course") || lower.contains("foot") || lower.contains("match")) {
            event.setCategory("SPORT");
        } else if (lower.contains("dentiste") || lower.contains("médecin") || lower.contains("docteur")
                || lower.contains("doctor")) {
            event.setCategory("HEALTH");
        } else if (lower.contains("ami") || lower.contains("dîner") || lower.contains("fête")
                || lower.contains("friend")) {
            event.setCategory("SOCIAL");
        } else {
            event.setCategory("WORK");
        }

        event.setPriority("MEDIUM");
        System.out.println("[AI] Fallback parsed: action=" + event.getAction() + ", title=" + event.getTitle() + ", searchTitle=" + event.getSearchTitle());
        return event;
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty())
            return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}
