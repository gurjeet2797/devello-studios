#!/bin/bash
set -e

EVENT_ID="${1}"
FORWARD_TO="${2:-http://localhost:3000/api/webhooks/stripe}"

if [ -z "$EVENT_ID" ]; then
  echo "Usage: $0 <event_id> [forward_to_url]"
  exit 1
fi

echo "Replaying Stripe event $EVENT_ID to $FORWARD_TO"
echo "Requires stripe CLI installed and STRIPE_SECRET_KEY set for auth."

stripe events resend --id "$EVENT_ID" --forward-to "$FORWARD_TO"

if [ $? -eq 0 ]; then
  echo "Replay sent. Check webhook logs for processing details."
else
  echo "Stripe replay failed"
  exit 1
fi
