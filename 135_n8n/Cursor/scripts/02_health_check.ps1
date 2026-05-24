# Gọi tay workflow 02 — bấm Manual Trigger qua Execute Workflow trong UI thay vì webhook.
# Script này thử endpoint mà workflow đang probe để đối chiếu kết quả.
$probe = "https://httpbin.org/status/200"
Write-Host "Probing $probe (giống node 'Probe URL' trong workflow 02)"
try {
    $resp = Invoke-WebRequest -Uri $probe -UseBasicParsing -TimeoutSec 5
    Write-Host "OK statusCode=$($resp.StatusCode)"
} catch {
    Write-Host "ALERT $($_.Exception.Message)"
}
