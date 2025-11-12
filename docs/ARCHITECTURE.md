# Iqembu Lamanzi - System Architecture

## Overview

Iqembu Lamanzi is a comprehensive sewage incident management system that combines machine learning, real-time communication, and geospatial data management. The system enables citizens to report sewage issues via WhatsApp, automatically analyzes images using AI, and provides maintenance teams with efficient incident tracking and resolution tools.

## System Components

### 1. Backend Services (Node.js/Express)

**Location:** `/backend/`

**Responsibilities:**
- RESTful API for incident and job card management
- WhatsApp integration via Twilio
- User authentication and authorization
- Real-time notifications
- Geospatial data processing

**Key Technologies:**
- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Twilio for WhatsApp integration
- Socket.io for real-time updates (planned)

### 2. Machine Learning Service (Python)

**Location:** `/backend/ml/`

**Responsibilities:**
- Image classification for sewage-related content
- Real-time analysis of user-submitted photos
- Model training and evaluation
- Fallback keyword-based analysis

**Key Technologies:**
- PyTorch/TensorFlow
- OpenCV for image processing
- NumPy, Pandas for data manipulation
- Flask/FastAPI for model serving (planned)

### 3. Frontend Dashboard (React/Vue)

**Location:** `/frontend/` (planned)

**Responsibilities:**
- Incident monitoring and management
- Team assignment and tracking
- Heatmap visualization
- Real-time status updates
- Mobile-responsive design

**Key Technologies:**
- React.js or Vue.js
- Leaflet/Mapbox for maps
- Chart.js/D3.js for data visualization
- PWA capabilities for mobile access

### 4. Mobile Application (React Native/Capacitor)

**Location:** `/mobile/` (planned)

**Responsibilities:**
- Offline incident reporting
- GPS location services
- Camera integration for photo capture
- Push notifications
- Team coordination features

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   WhatsApp      │  │   Twilio SMS    │  │   MongoDB Atlas │  │
│  │   (Citizens)    │  │   (Notifications)│  │   (Database)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend Services                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Express API   │  │   Twilio Webhook│  │   Notification  │  │
│  │   (REST/GraphQL)│  │   Handler       │  │   Service       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Auth Service  │  │   Incident      │  │   Job Card      │  │
│  │   (JWT/OAuth)   │  │   Management    │  │   Management    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ML Services                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Image Analysis│  │   Model Training│  │   Data Pipeline │  │
│  │   Service       │  │   Pipeline      │  │   (ETL)         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Web Dashboard │  │   Mobile App    │  │   Admin Portal  │  │
│  │   (React/Vue)   │  │   (React Native)│  │   (Internal)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Incident Reporting Flow

```mermaid
sequenceDiagram
    participant C as Citizen
    participant W as WhatsApp
    participant T as Twilio
    participant B as Backend API
    participant ML as ML Service
    participant DB as Database
    participant N as Notification Service

    C->>W: Send message/photo/location
    W->>T: Webhook trigger
    T->>B: POST /whatsapp (webhook)
    B->>ML: Analyze image (if present)
    ML-->>B: Classification result
    B->>DB: Create incident record
    DB-->>B: Incident created
    B->>N: Send notifications
    N->>W: Notify relevant teams
    B-->>T: TwiML response
    T-->>W: Confirmation to citizen
```

### Incident Management Flow

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant API as Backend API
    participant DB as Database
    participant T as Team Member
    participant W as WhatsApp

    D->>API: GET /api/incidents/unallocated
    API->>DB: Query unallocated incidents
    DB-->>API: Return incident list
    API-->>D: Incident data

    D->>API: POST /api/incidents/:id/allocate
    API->>DB: Update incident assignment
    DB-->>API: Confirmation
    API->>API: Create job card
    API-->>D: Success response

    API->>W: Notify team via WhatsApp
    T->>D: Access assigned job card
    D->>API: PUT /api/job-cards/:id/status
    API->>DB: Update job card status
```

## Database Schema

### Core Entities

```mermaid
erDiagram
    INCIDENT ||--o{ JOB_CARD : generates
    INCIDENT {
        string incidentNumber PK
        string reporterPhone
        string description
        string category
        string priority
        point location
        string status
        string[] mediaUrls
        date createdAt
        date updatedAt
    }

    JOB_CARD ||--|| TEAM : assigned_to
    JOB_CARD {
        objectId _id PK
        objectId incident FK
        objectId team FK
        objectId assignedBy FK
        string status
        string priority
        string description
        point location
        date estimatedCompletion
        note[] notes
        date createdAt
    }

    USER ||--o{ INCIDENT : reports
    USER ||--o{ JOB_CARD : assigns
    USER {
        objectId _id PK
        string userId
        string firstName
        string lastName
        string email
        string phone
        string role
        point location
    }

    TEAM ||--|{ USER : consists_of
    TEAM {
        objectId _id PK
        string name
        string description
        point baseLocation
        user[] members
    }
```

## API Architecture

### RESTful Design Principles

- **Resource-Based URLs:** `/api/incidents`, `/api/job-cards`, `/api/users`
- **HTTP Methods:** GET, POST, PUT, DELETE
- **Status Codes:** Standard HTTP status codes (200, 201, 400, 401, 404, 500)
- **Content Type:** JSON for all requests/responses
- **Authentication:** JWT Bearer tokens
- **Versioning:** URL-based versioning (`/api/v1/...`)

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant A as Auth Service
    participant DB as Database

    C->>A: POST /login (credentials)
    A->>DB: Validate user
    DB-->>A: User data
    A->>A: Generate JWT token
    A-->>C: Return token + user info

    C->>A: GET /api/protected (Authorization: Bearer <token>)
    A->>A: Verify JWT
    A-->>C: Protected resource
```

## Machine Learning Pipeline

### Image Analysis Architecture

```mermaid
graph TD
    A[User submits image] --> B[Image preprocessing]
    B --> C[Feature extraction]
    C --> D[Model inference]
    D --> E{Confidence > threshold?}
    E -->|Yes| F[Classify as sewage]
    E -->|No| G[Fallback: keyword analysis]
    F --> H[Return result]
    G --> H

    I[Training data] --> J[Data augmentation]
    J --> K[Model training]
    K --> L[Model evaluation]
    L --> M[Model deployment]
    M --> D
```

### Model Architecture

- **Input:** 224x224 RGB images
- **Preprocessing:** Normalization, resizing
- **Feature Extraction:** Convolutional layers
- **Classification:** Dense layers with softmax
- **Output:** Binary classification (sewage/not-sewage)
- **Training:** Transfer learning from ImageNet-pretrained models

## Deployment Architecture

### Production Environment

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/HAProxy]
    end

    subgraph "Application Servers"
        AS1[Node.js App Server 1]
        AS2[Node.js App Server 2]
        AS3[Node.js App Server 3]
    end

    subgraph "ML Servers"
        ML1[ML Service 1]
        ML2[ML Service 2]
    end

    subgraph "Database Cluster"
        DB[(MongoDB Primary)]
        DB1[(MongoDB Secondary 1)]
        DB2[(MongoDB Secondary 2)]
    end

    subgraph "External Services"
        WS[WhatsApp/Twilio]
        ST[Storage S3/Cloudinary]
    end

    LB --> AS1
    LB --> AS2
    LB --> AS3

    AS1 --> DB
    AS2 --> DB
    AS3 --> DB

    DB --> DB1
    DB --> DB2

    AS1 --> ML1
    AS2 --> ML2

    WS --> LB
    AS1 --> ST
    AS2 --> ST
```

### Containerization Strategy

- **Backend:** Docker containers with Node.js
- **ML Service:** GPU-enabled containers for model inference
- **Database:** MongoDB with persistent volumes
- **Orchestration:** Docker Compose for development, Kubernetes for production

## Security Architecture

### Authentication & Authorization
- JWT tokens with expiration
- Role-based access control (Guardian, Manager, Admin)
- Password hashing with bcrypt
- API rate limiting

### Data Protection
- HTTPS/TLS encryption
- Input validation and sanitization
- SQL injection prevention (MongoDB)
- XSS protection

### WhatsApp Security
- Twilio webhook signature validation
- Request rate limiting
- Content moderation for user inputs

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Database read replicas
- Load balancing across multiple instances
- CDN for static assets

### Performance Optimization
- Database indexing on frequently queried fields
- Caching layer (Redis planned)
- Image optimization and compression
- Lazy loading for large datasets

### Monitoring & Logging
- Application performance monitoring
- Error tracking and alerting
- Database query performance
- ML model accuracy monitoring

## Future Enhancements

### Planned Features
- Real-time WebSocket notifications
- Advanced ML models (object detection, segmentation)
- Predictive analytics for incident hotspots
- Integration with municipal GIS systems
- Mobile offline capabilities

### Technology Upgrades
- GraphQL API for flexible queries
- Microservices architecture
- Serverless functions for ML inference
- Advanced caching and CDN integration

## Development Workflow

### CI/CD Pipeline
```mermaid
graph LR
    A[Code Commit] --> B[Automated Testing]
    B --> C[Build Docker Images]
    C --> D[Deploy to Staging]
    D --> E[Integration Tests]
    E --> F[Deploy to Production]
    F --> G[Monitoring & Alerts]
```

### Environment Strategy
- **Development:** Local Docker Compose setup
- **Staging:** Cloud environment for testing
- **Production:** Highly available cloud infrastructure
- **Disaster Recovery:** Multi-region deployment with automated failover

This architecture provides a robust, scalable foundation for the Iqembu Lamanzi sewage incident management system, enabling efficient coordination between citizens, maintenance teams, and municipal authorities.