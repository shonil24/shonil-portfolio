---
id: woolies
title: Inventory Data Lakehouse
type: Data engineering
categories: data
image: /assets/projects/inventory.png
tags: BigQuery|Power BI|Dimensional modelling
summary: A unified inventory layer supporting distribution analytics across 20+ categories.
impact: 5M+ records processed
date: 2023
---
## Why this mattered
Regional inventory data needed a shared model that could support reliable reporting and demand analysis.

## Approach
Build BigQuery ETL pipelines, dimensional models and scheduled refreshes, then expose governed metrics through Power BI.

## Trade-offs and reasoning
A dimensional model takes more planning than querying source tables directly, but pays back in consistent definitions and better query performance.

## Outcome
A self-serve analytics foundation improved reporting reliability and supported a 15% reduction in stockouts.
