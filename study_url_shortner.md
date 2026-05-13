# High-Performance URL Shortener: System Design Study

This document provides a deep-dive analysis into the architecture of the URL Shortener project, explaining the scaling patterns, caching strategies, and data consistency models used to handle high-concurrency traffic.

---

## 1. High-Level System Architecture

The system uses a **multi-tier architecture** designed for horizontal scalability and sub-millisecond response times.

```mermaid
graph TD
    subgraph "Client Side"
        User((End User))
        Browser[Web Browser]
    end

    subgraph "Application Tier (Stateless)"
        LB[PM2 Cluster / Load Balancer]
        App1[Node.js Instance 1]
        App2[Node.js Instance 2]
        AppN[Node.js Instance N]
    end

    subgraph "Caching & Real-time Tier"
        Redis[(Redis Cluster)]
        RateLimit{Rate Limiter}
    end

    subgraph "Persistence Tier"
        MySQL[(MySQL Primary)]
        Analytics[(Analytics Table)]
    end

    User --> Browser
    Browser --> LB
    LB --> App1 & App2 & AppN
    App1 & App2 & AppN <--> Redis
    App1 & App2 & AppN --> MySQL
    Redis -- "Periodic Flush" --> Analytics
```

---

## 2. The "Write Path" (URL Creation)

When a user creates a shortened URL, we prioritize **Data Integrity** over raw speed. We write to the database first, then propagate to the cache.

```mermaid
sequenceDiagram
    autonumber
    participant User
    participant App
    participant MySQL
    participant Redis

    User->>App: POST /api/url/shorten {longURL}
    App->>App: Validate & Generate Unique ID
    App->>MySQL: INSERT INTO Urls (longURL, shortID)
    MySQL-->>App: Success (Primary Key ID)
    App->>Redis: SET id longURL (Pre-caching)
    App-->>User: 201 Created {shortID}
```

---

## 3. The "Read Path" (High-Speed Redirect)

This is the most critical path. It uses the **Cache-Aside** pattern to minimize database latency.

```mermaid
flowchart TD
    Start([User Clicks Short Link]) --> CheckRedis{Check Redis?}
    CheckRedis -- "HIT (Fast)" --> Redirect([Redirect Immediately])
    CheckRedis -- "MISS (Slow)" --> QuerySQL[Query MySQL Database]
    QuerySQL --> Found{Found?}
    Found -- "No" --> Error[404 Not Found]
    Found -- "Yes" --> PopulateRedis[Save to Redis]
    PopulateRedis --> Redirect
    
    style CheckRedis fill:#f9f,stroke:#333,stroke-width:2px
    style Redirect fill:#00ff00,color:#000
```

---

## 4. Analytics Buffering (Write-Back Pattern)

Instead of updating the database on every click, we "buffer" increments in Redis and sync them in batches.

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Redis
    participant MySQL
    participant SyncTask

    Note over User,Redis: User Clicks (Millions of times)
    User->>App: Redirect Request
    App->>Redis: INCR clicks:ID
    App-->>User: Redirected
    
    Note over Redis,SyncTask: Every 6 Minutes (Interval)
    SyncTask->>Redis: KEYS clicks:*
    SyncTask->>Redis: GET count for each ID
    SyncTask->>MySQL: UPDATE Analytics SET totalVisits += count
    SyncTask->>Redis: DEL clicks:* (Reset Buffer)
```

---

## 5. Security Architecture (Rate Limiting)

We use a distributed sliding window algorithm to prevent API abuse.

```mermaid
graph LR
    IP[User IP Address] --> Limiter{Rate Limiter}
    Limiter -- "< 5 req/min" --> Allow[Allow Request]
    Limiter -- "> 5 req/min" --> Deny[429 Too Many Requests]
    
    subgraph "Redis State"
        Limiter <--> RKeys[IP_Bucket_Timestamp]
    end
```

---

## 6. Database Schema Design (ER Diagram)

The relationship between URLs and their analytics is **1:1** or **1:N** depending on the granularity required.

```mermaid
erDiagram
    URL ||--|| ANALYTICS : tracks
    URL {
        int id PK
        string longURL
        string shortID UK
        datetime createdAt
    }
    ANALYTICS {
        int id PK
        int totalVisits
        int urlId FK
        datetime updatedAt
    }
```

---

## 7. Reliability: Failure Mode Analysis

| Component Failure | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Redis Down** | Slow Response | App falls back to MySQL for all reads/writes. |
| **MySQL Down** | Outage | Read-only mode can be enabled if Redis is alive. |
| **App Node Crash** | Minimal | PM2 automatically restarts the process on other cores. |

---
*Prepared by Antigravity AI for Project Scale-Up - May 2024*
