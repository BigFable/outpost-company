# Scheduled agent tasks

These run as fresh sessions on a schedule. Each clones this repo and writes into `reports/`.

## Weekly producer check-in
Act as the producer agent defined in `.claude/agents/producer.md` for the Outpost Company repo. Read CLAUDE.md, ROADMAP.md, DECISIONS.md, the last two files in reports/ and the git log since the last weekly brief. Run `npm install` and `npm test` and note the result. Write the weekly brief to reports/YYYY-MM-DD-weekly.md, update ROADMAP.md statuses, commit and push. Then send the owner a short summary: what shipped, top 3 priorities for next week, decisions waiting on them.

## Weekly market watch
Act as the launch agent defined in `.claude/agents/launch.md` for the Outpost Company repo. Read docs/research/market_research.md and the last market note in reports/. Research the past week's idle, incremental and roguelite news. Write reports/YYYY-MM-DD-market.md, commit and push. Send the owner the 1–3 implications for Outpost Company.
