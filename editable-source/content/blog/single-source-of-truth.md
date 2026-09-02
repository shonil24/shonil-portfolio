---
id: single-source-of-truth
status: Published
category: Data engineering
date: September 2026
title: The hardest part of a single source of truth is the sentence after the number.
excerpt: A data platform becomes useful when people can explain where a number came from, what it means, and what to do next.
---
## Post
A “single source of truth” sounds like an architecture problem. In practice, the difficult part is rarely moving records from one system to another. It is getting a group of people to agree on the sentence that should follow the number.

At SGFleet, the same contract data could be reconciled by different teams in different ways. The result was not just duplicated logic. It was a loss of confidence: every report arrived with a quiet question attached — which version should we believe?

The useful work happened in the space between the pipeline and the dashboard. Definitions had to be explicit. Ownership had to be visible. Lineage had to be something a person could follow without booking a meeting. A governed lakehouse helped, but only because it made those decisions easier to see and repeat.

That is the part of data work I keep coming back to: trust is not a decorative layer added after delivery. It is a product feature. If the person downstream can understand the shape of the data and the limits of the metric, they can make a better decision with it.

The best data platform is not the one with the most layers. It is the one that makes the next good question easier to ask — and easier to answer together.
