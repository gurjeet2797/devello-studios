$ErrorActionPreference = "Stop"

param(
  [Parameter(Mandatory = $true)]
  [string]$EventId,

  [Parameter(Mandatory = $false)]
  [string]$ForwardTo = "http://localhost:3000/api/webhooks/stripe"
)

Write-Host "Replaying Stripe event $EventId to $ForwardTo"
Write-Host "Requires stripe CLI installed and STRIPE_SECRET_KEY set for auth." -ForegroundColor Yellow

& stripe events resend --id $EventId --forward-to $ForwardTo

if ($LASTEXITCODE -ne 0) {
  Write-Error "Stripe replay failed"
  exit 1
}

Write-Host "Replay sent. Check webhook logs for processing details." -ForegroundColor Green
