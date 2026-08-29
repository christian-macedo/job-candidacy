# Master Profile: Robin Alvarez

_Fictional. This profile exists so the plugin ships a worked example and a fixture the checks
can run against. Every person, employer and number in it is invented._

## Contact

- **Location:** Portland, OR, USA
- **Email:** robin@example.com _(the address to publish; robin.alvarez.personal@example.com is the personal one)_
- **Phone:** +1 555-0142
- **Website:** robinalvarez.example
- **LinkedIn:** linkedin.com/in/robinalvarez
- **Languages:** English (native), Portuguese (conversational)
- **Work authorization:** US citizen. Anywhere else requires sponsorship.

**Target roles:** Engineering Manager or Senior Engineering Manager on a platform,
infrastructure or reliability team.

**Summary (long):** Engineering manager with 12 years in backend and platform work, the last
five leading a team through a rewrite of its core data path. Comfortable staying close enough
to the code to review a design, and disciplined about not writing it.

## Experience

### [NWL] Engineering Manager · Northwind Logistics
Portland, OR · Mar 2021 – Present
**Scope:** 7 engineers, 6 services, the shipment tracking data path for a freight marketplace.
**Context:** Northwind matches shippers with carriers. Tracking is the surface customers judge
the product on, so its reliability is the team's whole reason to exist.

- [NWL-M-01] Grew the tracking team from 4 to 7 engineers over 18 months, hiring 3 and supporting 1 promotion to senior. | skills: hiring, org design | metric: 4 to 7 engineers
- [NWL-M-02] Cut weekly on-call pages from 90 to 22 by retiring alerts no team could act on and routing the rest to the owning service. | skills: incident response, observability | metric: 90 to 22 pages per week
- [NWL-M-03] Took the delivery-estimate rewrite from proposal to production in 2 quarters, shipped behind a flag with no rollback. | skills: delivery, project management | metric: 2 quarters
- [NWL-M-04] Turned around an underperforming senior engineer over a 9 week plan; they stayed and led the following quarter's largest project. | skills: performance management, coaching | metric: 9 weeks
- [NWL-M-05] Ran the build-versus-buy review for route optimisation and argued for buying, which freed an estimated 14 engineer-months. | skills: technical judgment, vendor evaluation | metric: 14 engineer-months
- [NWL-M-06] Introduced a written design review that 3 teams adopted, cutting median time from design doc to approval from 11 days to 4. | skills: technical leadership, process | metric: 11 days to 4
- [NWL-E-01] Designed the event schema behind shipment tracking, carrying 40 million events a day across 6 services. | skills: distributed systems, Kafka | metric: 40 million events per day
- [NWL-E-02] Led the migration of 9 services off a shared Postgres instance onto per-service databases with no customer-visible downtime. | skills: Postgres, migrations | metric: 9 services

### [CW] Senior Software Engineer · Cartwheel Software
Remote · Jun 2017 – Feb 2021
**Scope:** Individual contributor on the billing and platform team, 5 engineers.
**Context:** Cartwheel sold a subscription analytics product to mid-market companies.

- [CW-01] Built the billing reconciliation service that closed a 2% leak on subscription upgrades. | skills: Go, payments | metric: 2% of upgrade revenue
- [CW-02] Reduced p95 API latency from 780ms to 240ms by replacing per-request fan-out with a materialised read model. | skills: performance, caching | metric: 780ms to 240ms
- [CW-03] Mentored 4 engineers through their first on-call rotation and wrote the runbooks the team still uses. | skills: mentoring, documentation | metric: 4 engineers

### [RVF] Software Engineer · Ravensfield Consulting
Portland, OR · Aug 2013 – May 2017
**Scope:** Delivery engineer across client engagements.
**Context:** A consultancy building integrations for logistics and retail clients.

- [RVF-01] Delivered 5 client integrations against a legacy SOAP API, each inside a fixed 6 week engagement. | skills: integrations, consulting | metric: 5 integrations

## Skills inventory
| Skill | Depth | Last used | Evidence |
|---|---|---|---|
| Kubernetes / EKS | working | 2026 | NWL-E-02 |
| Go | deep | 2021 | CW-01, CW-02 |
| Postgres | deep | 2026 | NWL-E-02 |
| Kafka | deep | 2026 | NWL-E-01 |
| Team leadership | deep | 2026 | NWL-M-01, NWL-M-04 |
| Incident response | deep | 2026 | NWL-M-02 |

## Education

### BSc, Computer Science · Anderson Institute of Technology
2009 – 2013

## Open questions

- Whether to target Senior Engineering Manager directly or take an EM role with a stated path.
