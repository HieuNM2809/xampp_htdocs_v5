# Gọi webhook workflow 01 sau khi đã Activate trong n8n UI
$uri = "http://localhost:5678/webhook/hello"
$body = @{ name = "Hiếu" } | ConvertTo-Json

Write-Host "POST $uri"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body
