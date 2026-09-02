---
id: atlikon
title: End-to-End FMCG Data Engineering
type: Data engineering
categories: data
image: /assets/projects/atlikon.png
tags: Databricks|PySpark|AWS S3|Delta Lake
summary: A reliable lakehouse for two FMCG companies with fragmented schemas, historical backfill and daily incremental loads.
impact: 50K+ records unified
date: 2026
featured: true
---
## Why this mattered
Atlikon and Sportbar were reporting from different schemas and spreadsheet workflows after an acquisition. The goal was one trustworthy analytics layer without losing historical context.

## Approach
Ingest raw CSV data from S3 into a Databricks medallion architecture, apply validation and deduplication, then use Delta Lake merge logic for incremental updates. A star schema makes the final layer usable for BI.

## Trade-offs and reasoning
Clear, testable layers are more useful than one clever transformation. Batch processing keeps the system easier to operate while daily reporting does not justify streaming complexity yet.

## Outcome
The pipeline creates a single source of truth ready for leadership dashboards and self-serve analysis.
