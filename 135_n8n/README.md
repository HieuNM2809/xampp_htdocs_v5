# 135 — n8n (workflow automation)

Mini-project học [n8n](https://n8n.io/) self-host bằng Docker.

| Thư mục | Mục đích |
|---------|----------|
| [`Cursor/`](Cursor/) | Ví dụ chạy từ **Cursor** — webhook → set node trả JSON tĩnh |
| [`Claude/`](Claude/) | Ví dụ chạy từ **Claude Code** — webhook → gọi Claude API → trả reply do AI sinh |

Mỗi folder con là một stack docker-compose độc lập, **cùng port 5678** — không chạy đồng thời.

- Học n8n cơ bản: [`Cursor/README.md`](Cursor/README.md)
- Tích hợp Claude API: [`Claude/README.md`](Claude/README.md)
