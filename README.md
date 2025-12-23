# 🗓️ Smart Agenda AI

Application de gestion d'agenda intelligent utilisant une architecture **Microservices** avec **Spring Boot**, **Angular 20**, **Kafka**, et **PostgreSQL**.

## 🎯 Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| **📝 Gestion d'événements** | Créer, modifier, supprimer des événements avec catégories |
| **🤖 IA (OpenRouter)** | Extraction automatique d'événements depuis du texte naturel |
| **🔔 Notifications temps réel** | Rappels (30min, 1h, 1 jour avant) via WebSocket |
| **📨 Kafka** | Communication asynchrone entre microservices |
| **🔐 Authentification JWT** | Sécurité avec tokens JWT |
| **🎨 Interface moderne** | Design glassmorphism avec thème sombre/clair |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Angular 20)                          │
│                             localhost:4200                                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
┌────────────────────────────────────▼─────────────────────────────────────┐
│                        GATEWAY SERVICE (8088)                             │
│                   Routage API + Authentification JWT                      │
└────────────────────────────────────┬─────────────────────────────────────┘
            ┌────────────────────────┼────────────────────────┐
            ▼                        ▼                        ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│   AUTH SERVICE    │   │ CALENDAR SERVICE  │   │    AI SERVICE     │
│      (8089)       │   │      (8082)       │   │      (8081)       │
│                   │   │                   │   │                   │
│ • Inscription     │   │ • CRUD événements │   │ • OpenRouter API  │
│ • Connexion       │   │ • Kafka Producer  │   │ • Extraction JSON │
│ • JWT tokens      │   │ • PostgreSQL      │   │                   │
└───────────────────┘   └─────────┬─────────┘   └───────────────────┘
                                  │
                         ┌────────▼────────┐
                         │     KAFKA       │
                         │    (9092)       │
                         │  event-notif    │
                         └────────┬────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │ NOTIFICATION SERVICE (8085)│
                    │                           │
                    │ • Kafka Consumer          │
                    │ • WebSocket (STOMP)       │
                    │ • Rappels automatiques    │
                    └───────────────────────────┘
```

---

## 📋 Prérequis

- **Java 21+**
- **Docker & Docker Compose**
- **Node.js 20+ & npm**
- **Maven 3.9+**

---

## 🚀 Lancement Rapide (Docker)

### 1. Compiler le backend
```bash
cd backend
mvn clean package -DskipTests
```

### 2. Lancer tous les services
```bash
docker-compose up -d
```

### 3. Accéder à l'application
- **Frontend**: http://localhost:4200
- **Eureka Dashboard**: http://localhost:8761
- **Gateway API**: http://localhost:8088

---

## 🐳 Services Docker

| Service | Port | Description |
|---------|------|-------------|
| **postgres-db** | 5432 | Base de données PostgreSQL |
| **kafka** | 9092 | Message broker (KRaft mode) |
| **discovery-service** | 8761 | Eureka Server |
| **auth-service** | 8089 | Authentification JWT |
| **calendar-service** | 8082 | Gestion des événements |
| **ai-service** | 8081 | IA avec OpenRouter |
| **notification-service** | 8085 | Notifications + WebSocket |
| **gateway-service** | 8088 | API Gateway |
| **frontend** | 4200 | Application Angular |

---

## 💡 Utilisation

### 1. Créer un compte
1. Aller sur http://localhost:4200
2. Cliquer sur "S'inscrire"
3. Entrer un nom d'utilisateur et mot de passe

### 2. Créer un événement manuellement
1. Aller sur "Calendrier"
2. Cliquer sur une date
3. Remplir le formulaire et cliquer "Créer"

### 3. Utiliser l'IA pour créer un événement
1. Dans le Dashboard, utiliser la barre IA
2. Taper: "RDV dentiste demain à 14h"
3. L'IA extrait automatiquement les détails

### 4. Recevoir des rappels
- Les rappels sont envoyés automatiquement 30min, 1h, ou 1 jour avant l'événement

---

## 🧪 Tester Kafka

### Terminal 1 - Consumer (log notifications)
```bash
docker logs -f notification-service
```

### Terminal 2 - Producer (log événements)
```bash
docker logs -f calendar-service
```

### Créer un événement et observer :
1. Créer un événement via l'app
2. **Terminal 2**: `[KAFKA PRODUCER] Message sent...`
3. **Terminal 1**: `[KAFKA CONSUMER] Received...`

---

## 🛠️ Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Angular 20, TypeScript, CSS (Glassmorphism) |
| **Backend** | Spring Boot 3.3, Spring Cloud Gateway, Eureka |
| **Base de données** | PostgreSQL 16 |
| **Message Broker** | Apache Kafka 3.7 (KRaft mode) |
| **IA** | OpenRouter API (Mistral-7B) |
| **Authentification** | JWT (JSON Web Tokens) |
| **WebSocket** | STOMP + SockJS |
| **Conteneurisation** | Docker, Docker Compose |

---

## 📁 Structure du Projet

```
Agenda Smart/
├── backend/
│   ├── discovery-service/      # Eureka Server
│   ├── gateway-service/        # API Gateway + JWT
│   ├── auth-service/           # Authentification
│   ├── calendar-service/       # Gestion événements
│   ├── ai-service/             # IA OpenRouter
│   └── notification-service/   # Notifications + Kafka Consumer
├── frontend/                   # Angular 20
└── docker-compose.yml          # Orchestration Docker
```

---

## 👨‍💻 Auteur

Projet réalisé dans le cadre d'un PFA (Projet de Fin d'Année).

---

© 2024 Smart Agenda AI - Microservices + Kafka
