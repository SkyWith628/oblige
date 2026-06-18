# OBLIGE DB — PostgreSQL 스키마 & 마이그레이션

> Phase 2에서 구축. 현재는 골격 placeholder.

- PostgreSQL + Alembic 마이그레이션
- 비즈니스 로직/테이블 명세: [../docs/database-management-design.md](../docs/database-management-design.md)
- 기존 MySQL 스키마(`../database/`)와 Supabase 스키마(`../supabase/`)를 참조해 이전

## 핵심 테이블
profiles · grade_rules · products · categories · cart_items ·
orders · order_items · order_status_histories ·
empty_bottle_returns · return_status_histories ·
refill_requests · point_transactions · inventory_transactions ·
campaigns · campaign_participants · site_contents · admin_logs
