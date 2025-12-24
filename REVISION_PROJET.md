# 📚 Guide de Révision - Projet Smart Agenda AI

> **Document préparé pour l'évaluation du projet**  
> Ce guide couvre : Angular 20, Microservices, Kafka, IA (OpenRouter), Sécurité JWT

---

## 📋 Table des Matières

1. [Vue d'ensemble du Projet](#1-vue-densemble-du-projet)
2. [Angular 20 - Fonctionnalités Principales](#2-angular-20---fonctionnalités-principales)
3. [Architecture Microservices](#3-architecture-microservices)
4. [Apache Kafka - Communication Asynchrone](#4-apache-kafka---communication-asynchrone)
5. [Intelligence Artificielle (IA)](#5-intelligence-artificielle-ia)
6. [Sécurité JWT](#6-sécurité-jwt)
7. [Liaison entre Microservices](#7-liaison-entre-microservices)
8. [Résumé Rapide pour l'Oral](#8-résumé-rapide-pour-loral)

---

## 1. Vue d'ensemble du Projet

### Description
**Smart Agenda AI** est une application de gestion d'agenda intelligente qui utilise l'IA pour extraire automatiquement des événements à partir de commandes en langage naturel (ex: "Réunion demain à 14h").

### Technologies Utilisées

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Angular 20, TypeScript, FullCalendar, STOMP/WebSocket |
| **Backend** | Spring Boot 3.5, Java 21, Spring Cloud |
| **Base de données** | PostgreSQL 16 |
| **Message Broker** | Apache Kafka 3.7 (mode KRaft) |
| **IA** | OpenRouter API (Mistral-7B-Instruct) |
| **Conteneurisation** | Docker, Docker Compose |

### Architecture Globale

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Angular 20)                              │
│                         Port 4200 → Nginx                                 │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │    GATEWAY SERVICE        │
                    │    (Port 8088)            │
                    │  - Routage des requêtes   │
                    │  - Filtre JWT             │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
┌───────▼───────┐   ┌─────────────▼───────────┐   ┌────────▼────────┐
│ AUTH-SERVICE  │   │   CALENDAR-SERVICE      │   │   AI-SERVICE    │
│  (Port 8089)  │   │     (Port 8082)         │   │   (Port 8081)   │
│  - JWT        │   │  - CRUD Événements      │   │  - OpenRouter   │
│  - BCrypt     │   │  - Kafka Producer       │   │  - Mistral-7B   │
└───────────────┘   └───────────┬─────────────┘   └─────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   APACHE KAFKA        │
                    │   (Port 9092)         │
                    │   Topics:             │
                    │   - event-notifications│
                    │   - ai-events-topic   │
                    └───────────┬───────────┘
                                │
                    ┌───────────▼───────────┐
                    │ NOTIFICATION-SERVICE  │
                    │     (Port 8085)       │
                    │  - Kafka Consumer     │
                    │  - WebSocket (STOMP)  │
                    │  - Rappels auto       │
                    └───────────────────────┘
                    
        ┌───────────────────────────────────┐
        │     DISCOVERY-SERVICE (Eureka)    │
        │           (Port 8761)             │
        │  - Registre des microservices     │
        └───────────────────────────────────┘
```

---

## 2. Angular 20 - Fonctionnalités Principales

### 📂 Structure du Projet Frontend

```
frontend/src/app/
├── core/
│   ├── services/          # Services injectables
│   │   ├── auth.service.ts       # Authentification JWT
│   │   ├── agenda.service.ts     # Gestion des événements
│   │   ├── notification.service.ts  # WebSocket + notifications
│   │   └── theme.service.ts      # Mode sombre/clair
│   ├── guards/            # Protection des routes
│   └── interceptors/      # Injection du token JWT
├── features/
│   ├── auth/              # Page de connexion
│   └── dashboard/         # Tableau de bord principal
│       └── components/
│           ├── smart-input.component.ts   # Saisie IA
│           └── calendar-view.component.ts # Vue calendrier
└── app.routes.ts          # Configuration des routes
```

### 🔑 Fonctionnalités Clés d'Angular 20
Le projet utilise les **dernières fonctionnalités** de Angular 20 :

#### 1. **Signals (Signaux)**
Remplacent les BehaviorSubject pour une réactivité plus performante :

```typescript
// Dans auth.service.ts
private readonly _userInfo = signal<UserInfo | null>(this.loadUserInfo());

readonly isAuthenticated = computed(() => !!this._userInfo());
readonly username = computed(() => this._userInfo()?.username || 'Utilisateur');
```

> **À retenir** : Les signaux (`signal()`) sont la nouvelle façon de gérer l'état réactif dans Angular 20. `computed()` permet de dériver des valeurs automatiquement.

#### 2. **Standalone Components**
Pas de NgModules, chaque composant est autonome :

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,  // ← Composant standalone
  imports: [CommonModule, FormsModule, SmartInputComponent, CalendarViewComponent],
  template: `...`
})
export class DashboardComponent { }
```

#### 3. **Inject Function**
Nouvelle façon d'injecter les dépendances :

```typescript
// Ancienne méthode (constructeur)
constructor(private http: HttpClient) { }

// Nouvelle méthode Angular 20
private http = inject(HttpClient);  // ← Plus propre
```

#### 4. **Lazy Loading avec Routes**
Chargement différé des composants :

```typescript
// app.routes.ts
export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    { path: 'login', loadComponent: () => 
        import('./features/auth/login.component').then(m => m.LoginComponent) },
    { path: 'dashboard', loadComponent: () => 
        import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
];
```

#### 5. **Dépendances Clés (package.json)**

```json
{
  "@angular/core": "^20.3.0",
  "@fullcalendar/angular": "^6.1.19",   // Calendrier interactif
  "@stomp/stompjs": "^7.2.1",            // WebSocket STOMP
  "sockjs-client": "^1.6.1"              // Fallback WebSocket
}
```

---

## 3. Architecture Microservices

### 🏗️ Les 6 Microservices

| Service | Port | Responsabilité |
|---------|------|----------------|
| **discovery-service** | 8761 | Registre Eureka - découverte des services |
| **gateway-service** | 8088 | Point d'entrée unique, routage, filtre JWT |
| **auth-service** | 8089 | Authentification, génération JWT, BCrypt |
| **calendar-service** | 8082 | CRUD événements, producteur Kafka |
| **ai-service** | 8081 | Extraction IA via OpenRouter |
| **notification-service** | 8085 | Consommateur Kafka, WebSocket, rappels |

---

### 🔍 Discovery Service (Eureka)

**Rôle** : Registre central où tous les microservices s'enregistrent pour être découverts.

**Fichier clé** : `discovery-service/src/main/resources/application.yml`

```yaml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false  # Ne s'enregistre pas lui-même
    fetch-registry: false
```

**Point d'accès** : `http://localhost:8761` pour voir le dashboard Eureka.

---

### 🚪 Gateway Service (API Gateway)

**Rôle** : Point d'entrée unique pour toutes les requêtes. Route vers les bons services et applique le filtre JWT.

**Fichier clé** : `gateway-service/src/main/resources/application.yml`

```yaml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: http://auth-service:8089
          predicates:
            - Path=/api/auth/**
            # ← Pas de filtre JWT (routes publiques)

        - id: calendar-service
          uri: http://calendar-service:8082
          predicates:
            - Path=/api/calendar/**
          filters:
            - JwtAuthenticationFilter  # ← Vérifie le token JWT

        - id: ai-service
          uri: http://ai-service:8081
          predicates:
            - Path=/api/ai/**
          filters:
            - JwtAuthenticationFilter  # ← Vérifie le token JWT
```

---

### 🔐 Auth Service

**Rôle** : Gestion de l'authentification utilisateur avec JWT.

**Fichiers clés** :
- `AuthController.java` - Endpoints /register et /token
- `JwtService.java` - Génération du token JWT
- `SecurityConfig.java` - Configuration Spring Security

**Endpoints** :

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/auth/register` | Inscription d'un nouvel utilisateur |
| POST | `/api/auth/token` | Connexion et obtention du JWT |

---

### 📅 Calendar Service

**Rôle** : Gestion CRUD des événements. Envoie des notifications via Kafka.

**Fichiers clés** :
- `CalendarController.java` - API REST des événements
- `EventEntity.java` - Modèle de données
- `KafkaNotificationProducer.java` - Envoi vers Kafka

**Endpoints** :

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/calendar` | Liste des événements de l'utilisateur |
| POST | `/api/calendar` | Créer un événement |
| PUT | `/api/calendar/{id}` | Modifier un événement |
| DELETE | `/api/calendar/{id}` | Supprimer un événement |

**Exemple de code - Kafka Producer** :

```java
@Service
public class KafkaNotificationProducer {
    private static final String TOPIC = "event-notifications";
    
    @Autowired
    private KafkaTemplate<String, Map<String, Object>> kafkaTemplate;
    
    public void sendEventNotification(EventEntity event, String type) {
        Map<String, Object> message = new HashMap<>();
        message.put("id", event.getId());
        message.put("title", event.getTitle());
        message.put("type", type);  // CREATED, UPDATED, DELETED
        message.put("userId", event.getUserId());
        
        kafkaTemplate.send(TOPIC, message);  // ← Envoi vers Kafka
    }
}
```

---

### 🤖 AI Service

**Rôle** : Extraction intelligente d'événements à partir de texte en langage naturel.

**Fichiers clés** :
- `AiController.java` - Endpoint /api/ai/extract
- `OpenRouterService.java` - Appel à l'API OpenRouter

**Endpoint** :

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/ai/extract` | Analyse le texte et retourne un EventDto |

---

### 🔔 Notification Service

**Rôle** : Écoute les messages Kafka et les transmet en temps réel via WebSocket aux clients Angular.

**Fichiers clés** :
- `KafkaEventConsumer.java` - Consomme les messages Kafka
- `WebSocketConfig.java` - Configuration STOMP/WebSocket
- `ReminderScheduler.java` - Rappels automatiques

---

## 4. Apache Kafka - Communication Asynchrone

### 🎯 Pourquoi Kafka ?

- **Découplage** : Les services ne dépendent pas directement les uns des autres
- **Asynchrone** : Les notifications sont traitées sans bloquer les opérations principales
- **Fiabilité** : Les messages sont persistés jusqu'à leur consommation

### 📬 Topics Kafka

| Topic | Producteur | Consommateur | Contenu |
|-------|------------|--------------|---------|
| `event-notifications` | calendar-service | notification-service | Événements CRUD |
| `ai-events-topic` | ai-service | calendar-service | Événements extraits par l'IA |

### 🔄 Flux de Communication

```
1. CRÉATION D'ÉVÉNEMENT :
   [Angular] → POST /api/calendar
            → [Gateway] → [Calendar-Service]
            → Sauvegarde PostgreSQL
            → Kafka.send("event-notifications", {type: "CREATED", ...})
            → [Notification-Service] → WebSocket
            → [Angular] affiche une notification

2. EXTRACTION IA :
   [Angular] → POST /api/ai/extract {text: "Réunion demain à 14h"}
            → [Gateway] → [AI-Service]
            → OpenRouter API (Mistral-7B)
            → Kafka.send("ai-events-topic", EventDto)
            → Retourne EventDto au frontend
```

### 📝 Configuration Kafka (docker-compose.yml)

```yaml
kafka:
  image: apache/kafka:3.7.0
  environment:
    KAFKA_NODE_ID: 1
    KAFKA_PROCESS_ROLES: broker,controller  # Mode KRaft (sans Zookeeper)
    KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:29092,CONTROLLER://0.0.0.0:9093
    KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
  ports:
    - "9092:9092"
```

> **Note** : Le projet utilise Kafka en **mode KRaft** (sans Zookeeper), qui est le nouveau standard depuis Kafka 3.3+.

### 💻 Consumer Kafka (notification-service)

```java
@Service
public class KafkaEventConsumer {
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    @KafkaListener(topics = "event-notifications", groupId = "notification-group")
    public void consumeEventNotification(Map<String, Object> event) {
        // Crée une notification
        NotificationMessage notification = new NotificationMessage();
        notification.setType((String) event.get("type"));
        notification.setTitle((String) event.get("title"));
        
        // Envoie via WebSocket à tous les clients Angular
        messagingTemplate.convertAndSend("/topic/notifications", notification);
    }
}
```

---

## 5. Intelligence Artificielle (IA)

### 🧠 Technologie Utilisée

| Aspect | Détail |
|--------|--------|
| **Provider** | OpenRouter.ai |
| **Modèle** | `mistralai/mistral-7b-instruct:free` |
| **Fallback** | Parsing local si pas de clé API |

### 🔧 Fonctionnement

1. **L'utilisateur tape** : "Réunion avec le client demain à 15h"
2. **Le frontend envoie** à `/api/ai/extract`
3. **L'AI Service** :
   - Construit un prompt système avec le contexte (date, catégories possibles)
   - Appelle l'API OpenRouter
   - Parse la réponse JSON
4. **Retourne un EventDto** :
```json
{
  "action": "CREATE",
  "title": "Réunion avec le client",
  "startDate": "2024-12-25",
  "startTime": "15:00",
  "category": "WORK",
  "priority": "MEDIUM"
}
```

### 📝 Code Clé - OpenRouterService.java

```java
@Service
public class OpenRouterService {
    @Value("${openrouter.api-key:}")
    private String apiKey;
    
    @Value("${openrouter.model:mistralai/mistral-7b-instruct:free}")
    private String model;
    
    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    
    public EventDto extractEvent(String userText) {
        // Si pas de clé API → parsing local
        if (apiKey == null || apiKey.isEmpty()) {
            return fallbackParse(userText, LocalDate.now().toString());
        }
        
        // Construction du prompt système
        String systemPrompt = """
            Analyze user text and determine the action and event details. Return ONLY valid JSON:
            {
              "action": "CREATE" or "UPDATE" or "DELETE",
              "title": "event title",
              "startDate": "YYYY-MM-DD",
              "startTime": "HH:mm",
              "category": "WORK",
              "priority": "MEDIUM"
            }
            
            Today: %s, Tomorrow: %s
            Categories: WORK, HEALTH, SPORT, SOCIAL
            """;
        
        // Appel HTTP à OpenRouter
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", model);
        requestBody.put("messages", List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userText)
        ));
        
        // Headers requis par OpenRouter
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.set("HTTP-Referer", "http://localhost:4200");
        headers.set("X-Title", "SmartAgendaAI");
        
        ResponseEntity<String> response = restTemplate.postForEntity(OPENROUTER_URL, entity, String.class);
        // ... parse JSON response
    }
}
```

### 🔄 Fallback (Parsing Local)

Si aucune clé API n'est configurée, le service utilise un parsing local :

```java
private EventDto fallbackParse(String text, String today) {
    String lower = text.toLowerCase();
    
    // Détection de l'action
    boolean isDelete = lower.contains("suppr") || lower.contains("annul");
    boolean isUpdate = lower.contains("modif") || lower.contains("chang");
    
    // Détection de la date EXPLICITE (DD/MM/YYYY ou DD-MM-YYYY) ← NOUVEAU
    Pattern datePattern = Pattern.compile("(\\d{1,2})[/\\-](\\d{1,2})[/\\-](\\d{4})");
    Matcher dateMatcher = datePattern.matcher(text);
    if (dateMatcher.find()) {
        int day = Integer.parseInt(dateMatcher.group(1));
        int month = Integer.parseInt(dateMatcher.group(2));
        int year = Integer.parseInt(dateMatcher.group(3));
        event.setStartDate(String.format("%04d-%02d-%02d", year, month, day));
    } else if (lower.contains("demain")) {
        event.setStartDate(LocalDate.now().plusDays(1).toString());
    }
    
    // Détection de l'heure (regex)
    Pattern p = Pattern.compile("(\\d{1,2})[h:]?(\\d{2})?");
    // ...
    
    // Détection de la catégorie
    if (lower.contains("sport") || lower.contains("gym")) {
        event.setCategory("SPORT");
    }
}
```

#### 📅 Formats de Date Supportés

| Entrée utilisateur | Date extraite | Format |
|-------------------|---------------|--------|
| "Réunion **demain** à 14h" | Date du lendemain | Relatif |
| "RDV **01/01/2026** 10h" | 2026-01-01 | DD/MM/YYYY |
| "Meeting **15-03-2025** 9h" | 2025-03-15 | DD-MM-YYYY |
| "Cours à 16h" | Date du jour | Par défaut |

---

## 6. Sécurité JWT

### 🔐 Architecture de Sécurité

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Angular   │────▶│   Gateway    │────▶│  Microservices  │
│             │     │ JWT Filter   │     │                 │
│ Header:     │     │              │     │ Header:         │
│ Authorization:    │ 1. Valide    │     │ X-User-Id: john │
│ Bearer xxx  │     │ 2. Extrait   │     │                 │
└─────────────┘     │    username  │     └─────────────────┘
                    │ 3. Ajoute    │
                    │    X-User-Id │
                    └──────────────┘
```

### 🔑 Génération du Token (auth-service)

**Fichier** : `JwtService.java`

```java
@Component
public class JwtService {
    // Clé secrète (256 bits, encodée en Base64)
    public static final String SECRET = "5367566B59703373367639792F423F4528482B4D6251655468576D5A71347437";
    
    public String generateToken(String userName) {
        return Jwts.builder()
            .setSubject(userName)                              // Qui est l'utilisateur
            .setIssuedAt(new Date(System.currentTimeMillis())) // Quand créé
            .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30)) // Expire dans 30 min
            .signWith(getSignKey(), SignatureAlgorithm.HS256)  // Signature HMAC-SHA256
            .compact();
    }
    
    private Key getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SECRET);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
```

### 🛡️ Filtre JWT au Gateway

**Fichier** : `JwtAuthenticationFilter.java`

```java
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<Config> {
    
    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            // 1. Vérifie la présence du header Authorization
            String authHeader = exchange.getRequest()
                .getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Missing/Invalid Authorization Header");
            }
            
            // 2. Extrait et valide le token
            String token = authHeader.substring(7);
            String username = extractUsername(token);  // Parse le JWT
            
            // 3. Ajoute X-User-Id pour les services downstream
            ServerHttpRequest modifiedRequest = exchange.getRequest().mutate()
                .header("X-User-Id", username)
                .build();
            
            return chain.filter(exchange.mutate().request(modifiedRequest).build());
        };
    }
}
```

### 🔒 Configuration Spring Security (auth-service)

**Fichier** : `SecurityConfig.java`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())  // Désactivé car API REST stateless
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()  // Routes publiques
                .anyRequest().authenticated())                 // Reste protégé
            .authenticationProvider(authenticationProvider());
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();  // Hash des mots de passe
    }
}
```

### 📱 Côté Angular - Intercepteur HTTP

**Fichier** : `interceptors/auth.interceptor.ts`

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  
  if (token) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  return next(req);
};
```

---

## 7. Liaison entre Microservices

### 🔗 Types de Communication

| Type | Utilisé pour | Exemples |
|------|--------------|----------|
| **Synchrone (HTTP)** | Requêtes client-serveur | Login, CRUD événements |
| **Asynchrone (Kafka)** | Notifications, événements | Alertes, rappels |
| **WebSocket** | Temps réel | Notifications push |

### 📊 Schéma de Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                         ANGULAR FRONTEND                         │
├─────────────────────────────────────────────────────────────────┤
│  HTTP (REST API)                              WebSocket (STOMP)  │
│  ↓                                                      ↑       │
│  Gateway:8088                              Notification:8085     │
│  ├── /api/auth/** → Auth:8089                                   │
│  ├── /api/calendar/** → Calendar:8082                           │
│  └── /api/ai/** → AI:8081                                       │
│                         │                                        │
│                         ▼                                        │
│                 ┌──────────────┐                                │
│                 │    KAFKA     │                                │
│                 │   Topics:    │                                │
│                 │   └─event-   │───────────────────┐            │
│                 │     notifs   │                   │            │
│                 └──────────────┘                   ▼            │
│                                          Notification-Service    │
│                                          │                       │
│                                          └──► WebSocket Push     │
└─────────────────────────────────────────────────────────────────┘
```

### 🔍 Service Discovery (Eureka)

Tous les services s'enregistrent auprès d'Eureka :

```yaml
# Dans chaque service
eureka:
  client:
    service-url:
      defaultZone: http://discovery-service:8761/eureka/
```

Le Gateway peut alors router vers les services par leur nom :
```yaml
uri: http://calendar-service:8082  # Résolu par Eureka
```

---

## 8. Résumé Rapide pour l'Oral

### ⚡ Points Clés à Retenir

#### Angular 20
- ✅ **Signals** : Nouvelle réactivité (`signal()`, `computed()`)
- ✅ **Standalone** : Composants autonomes sans NgModule
- ✅ **inject()** : Injection de dépendances moderne
- ✅ **Lazy Loading** : `loadComponent()` dans les routes

#### Microservices
- ✅ **6 services** : Discovery, Gateway, Auth, Calendar, AI, Notification
- ✅ **API Gateway** : Point d'entrée unique avec routage
- ✅ **Eureka** : Découverte de services
- ✅ **Communication** : HTTP synchrone + Kafka asynchrone

#### Kafka
- ✅ **Mode KRaft** : Sans Zookeeper (moderne)
- ✅ **Topics** : `event-notifications`, `ai-events-topic`
- ✅ **Producer** : calendar-service → Kafka
- ✅ **Consumer** : notification-service ← Kafka → WebSocket

#### IA (OpenRouter)
- ✅ **Modèle** : Mistral-7B-Instruct (gratuit)
- ✅ **Endpoint** : `/api/ai/extract`
- ✅ **Parsing** : Texte naturel → EventDto JSON
- ✅ **Fallback** : Parsing local si pas d'API key

#### Sécurité JWT
- ✅ **Génération** : auth-service avec HS256
- ✅ **Validation** : Filtre au Gateway
- ✅ **Propagation** : Header `X-User-Id` vers les services
- ✅ **Mot de passe** : BCrypt pour le hashage

### 💬 Questions/Réponses Possibles

**Q: Pourquoi utiliser un API Gateway ?**
> R: Pour centraliser le routage, la sécurité (JWT), et les CORS. Un seul point d'entrée simplifie la gestion.

**Q: Pourquoi Kafka plutôt que des appels HTTP directs ?**
> R: Découplage entre services, communication asynchrone, fiabilité des messages. Calendar-service n'attend pas notification-service.

**Q: Comment l'IA extrait-elle les événements ?**
> R: On envoie le texte à OpenRouter avec un prompt système. Le modèle Mistral-7B retourne du JSON structuré avec titre, date, heure, catégorie.

**Q: Comment le JWT circule-t-il ?**
> R: Angular ajoute `Bearer token` dans le header. Le Gateway valide et extrait le username, l'ajoute en `X-User-Id` pour les services downstream.

**Q: Avantages des Signals Angular 20 ?**
> R: Plus performants que RxJS Subject, syntaxe plus simple, meilleure détection de changements, intégration native avec Angular.

---

## 📁 Fichiers Importants à Connaître

| Fichier | Localisation | Contenu Clé |
|---------|--------------|-------------|
| `docker-compose.yml` | Racine | Tous les services et leur configuration |
| `JwtService.java` | auth-service | Génération du token JWT |
| `JwtAuthenticationFilter.java` | gateway-service | Validation JWT |
| `OpenRouterService.java` | ai-service | Intégration IA |
| `KafkaNotificationProducer.java` | calendar-service | Envoi Kafka |
| `KafkaEventConsumer.java` | notification-service | Réception Kafka |
| `notification.service.ts` | frontend | WebSocket STOMP |
| `auth.service.ts` | frontend | Gestion du token Angular |
| `dashboard.component.ts` | frontend | Composant principal |

---

> **Bonne chance pour ton évaluation ! 🍀**
