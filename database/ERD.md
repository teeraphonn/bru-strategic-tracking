# Entity Relationship Diagram (ERD) - Strategic Performance Tracking System

This document visualizes the database schemas and relationships for the performance tracking system of Buriram Rajabhat University.

```mermaid
erDiagram
    faculties {
        int id PK
        varchar name UK
        datetime created_at
        datetime updated_at
    }
    
    departments {
        int id PK
        varchar name UK
        int faculty_id FK
        datetime created_at
        datetime updated_at
    }
    
    users {
        int id PK
        varchar username UK
        varchar password
        varchar name
        enum role "ADMIN, TEACHER, HEAD, DEAN, PRESIDENT"
        int department_id FK
        datetime created_at
        datetime updated_at
    }
    
    fiscal_years {
        int id PK
        int year UK
        boolean active
        datetime created_at
        datetime updated_at
    }
    
    budget_sources {
        int id PK
        varchar name UK
        datetime created_at
        datetime updated_at
    }
    
    strategies {
        int id PK
        varchar name
        varchar code UK
        datetime created_at
        datetime updated_at
    }
    
    sub_strategies {
        int id PK
        varchar name
        varchar code UK
        int strategy_id FK
        datetime created_at
        datetime updated_at
    }
    
    indicators {
        int id PK
        varchar name
        varchar code UK
        int sub_strategy_id FK
        datetime created_at
        datetime updated_at
    }
    
    projects {
        int id PK
        varchar name
        text description
        int fiscal_year_id FK
        int budget_source_id FK
        int sub_strategy_id FK
        int indicator_id FK "nullable"
        decimal total_budget
        int target_count
        varchar unit
        datetime start_date
        datetime end_date
        int completed_count
        int remaining_count
        double progress
        int creator_id FK
        int department_id FK "nullable"
        int faculty_id FK "nullable"
        datetime created_at
        datetime updated_at
    }
    
    project_users {
        int project_id PK,FK
        int user_id PK,FK
        datetime assigned_at
    }
    
    activities {
        int id PK
        int project_id FK
        varchar name
        text description
        datetime activity_date
        decimal budget
        boolean is_locked
        decimal actual_budget "nullable"
        boolean success
        int completed_count
        text remark "nullable"
        datetime created_at
        datetime updated_at
    }
    
    activity_images {
        int id PK
        int activity_id FK
        varchar file_path
        datetime created_at
    }

    faculties ||--o{ departments : "contains"
    faculties ||--o{ projects : "owns"
    departments ||--o{ users : "employs"
    departments ||--o{ projects : "owns"
    
    users ||--o{ projects : "creates"
    users ||--o{ project_users : "assigned"
    projects ||--o{ project_users : "requires"
    
    fiscal_years ||--o{ projects : "applies"
    budget_sources ||--o{ projects : "finances"
    
    strategies ||--o{ sub_strategies : "has"
    sub_strategies ||--o{ indicators : "has"
    sub_strategies ||--o{ projects : "aligns"
    indicators ||--o{ projects : "measures"
    
    projects ||--o{ activities : "contains"
    activities ||--o{ activity_images : "illustrates"
```

## Relationships Details

1. **One-to-Many (`1` to `N`):**
   - `faculties` -> `departments`: A faculty has many departments (e.g. Science -> Computer Science, Physics).
   - `departments` -> `users`: A department has many staff/teachers.
   - `strategies` -> `sub_strategies`: A main strategy consists of multiple sub-strategies.
   - `sub_strategies` -> `indicators`: A sub-strategy has multiple KPIs.
   - `projects` -> `activities`: A strategic project has multiple execution activities.
   - `activities` -> `activity_images`: An activity can document progress using multiple uploaded pictures.

2. **Many-to-Many (`N` to `M`):**
   - `projects` <-> `users` via `project_users`: A project can have multiple responsible coordinators (ผู้รับผิดชอบร่วม), and a user can coordinate multiple projects.

3. **Optional and Roll-up Keys:**
   - `projects.department_id` and `projects.faculty_id` are stored directly on the project to facilitate role-based dashboard aggregations for Heads and Deans. These keys automatically inherit the creator's affiliation during project creation.
