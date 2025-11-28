<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1rQ0lOz4pvgD1wLPAWkNvvwAbStYRm29v

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Data Model Sketch

Use immutable resource deltas plus protocol-specific tables to capture Gosplan + Kremlin history in a relational store (Supabase/Postgres).

### Core Audit Table

`resource_snapshots`

| column | type | notes |
| --- | --- | --- |
| id | uuid/bigint | primary key |
| user_id | uuid | owner of the record |
| recorded_at | timestamptz | default `now()` |
| cash_delta | numeric/bigint | change applied in this action |
| reserves_delta | numeric/bigint | change applied |
| debt_delta | numeric/bigint | change applied |
| source | enum (`requisition`, `supply_base`, `supply_bonus`, `balance_transfer`, `debt_attack`, `decree_adjustment`) | which protocol generated it |
| notes | text | optional context |

Each approved action writes one row describing the delta. Reconstruct balances by summing deltas (or also persisting current totals separately).

### Gosplan Detail Tables

- `requisitions`: stores slider split, total amount, approval status, `snapshot_id` FK.
- `supplies`: stores type (`base`/`bonus`), total amount, resulting deltas, `snapshot_id` FK.

### Kremlin Protocols Table

- `kremlin_actions`: columns for `protocol` (`balance_transfer`, `debt_attack`, `decree_adjustment`), amount/JSON payload, `snapshot_id` FK.

### Usage Pattern

1. When Gosplan/Kremlin confirms an action, wrap DB writes in a single transaction (or Supabase RPC): update running balances if needed, insert into the relevant detail table, insert the resource delta row.
2. KGB “Transaction History” queries `resource_snapshots` ordered by `recorded_at`.
3. Feature-specific pages join detail tables to snapshots for richer context (slider values, decree metadata, etc.).