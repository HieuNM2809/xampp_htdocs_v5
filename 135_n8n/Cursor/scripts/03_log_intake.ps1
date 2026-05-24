# Gửi log mẫu vào workflow 03. Đổi -Level error/info để thấy nhánh forward vs ack.
param(
    [string]$Service = "api-gateway",
    [string]$Level   = "error",
    [string]$Msg     = "Upstream 502 from auth-svc"
)

$uri  = "http://localhost:5678/webhook/log"
$body = @{ service = $Service; level = $Level; msg = $Msg } | ConvertTo-Json
Write-Host "POST $uri"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body
