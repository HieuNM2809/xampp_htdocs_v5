# Test workflow 04 — IP reputation. Đổi -Ip để check IP khác.
param(
    [string]$Ip = "8.8.8.8"
)

$uri  = "http://localhost:5678/webhook/ip-check"
$body = @{ ip = $Ip } | ConvertTo-Json
Write-Host "POST $uri (ip=$Ip)"
Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json" -Body $body
