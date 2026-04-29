# Skill: seo-audit

> Kiểm tra SEO cho website và tạo báo cáo với các khuyến nghị cụ thể.

## Cài đặt

```bash
npx skills add coreyhaines31/marketingskills
```

Hoặc copy thủ công folder này vào `_agents/skills/seo-audit/`.

## Cách dùng

Sau khi cài skill, chỉ cần nói với AI agent:

```
"Hãy kiểm tra SEO cho file index.html của tôi"
"Audit SEO trang https://example.com"
"Tìm các lỗi SEO trong folder src/"
```

AI sẽ tự động đọc `SKILL.md` và thực hiện audit theo đúng quy trình.

## Ví dụ

| File | Mô tả |
|------|-------|
| [`examples/bad-page.html`](./examples/bad-page.html) | Trang HTML có nhiều lỗi SEO |
| [`examples/good-page.html`](./examples/good-page.html) | Trang HTML đã tối ưu SEO |
| [`examples/audit-report.md`](./examples/audit-report.md) | Báo cáo audit mẫu |

## Cấu trúc Skill

```
seo-audit/
├── SKILL.md              ← Hướng dẫn chính cho AI agent
└── examples/
    ├── bad-page.html     ← Input mẫu (trang có lỗi)
    ├── good-page.html    ← Output mẫu (trang đã sửa)
    └── audit-report.md  ← Báo cáo mẫu
```

## Điểm skill này kiểm tra

- ✅ Title tag (độ dài, nội dung)
- ✅ Meta description
- ✅ Viewport meta (mobile-friendly)
- ✅ Heading structure (h1 → h2 → h3)
- ✅ Image alt text
- ✅ Canonical URL
- ✅ Open Graph tags (Facebook, Zalo)
- ✅ Schema markup (JSON-LD)
- ✅ Performance (minify, lazy load, WebP, defer JS)

## Nguồn gốc

Skill này được tham khảo từ [skills.sh](https://skills.sh/) — thư mục skills dành cho AI agents.
