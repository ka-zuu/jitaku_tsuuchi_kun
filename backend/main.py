import os
import json
from fastapi import FastAPI, Body
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from pywebpush import webpush, WebPushException
from pydantic import BaseModel

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# In-memory storage for the subscription object (for demonstration purposes)
subscription_info = None

class Subscription(BaseModel):
    endpoint: str
    keys: dict

VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY_PATH")
VAPID_PUBLIC_KEY = ""
VAPID_CLAIM_EMAIL = os.getenv("VAPID_CLAIM_EMAIL")

try:
    with open(os.getenv("VAPID_PUBLIC_KEY_PATH"), "r") as f:
        VAPID_PUBLIC_KEY = f.read().strip()
except FileNotFoundError:
    print("Error: VAPID public key file not found. Please generate keys.")
    # You might want to exit or handle this more gracefully
    VAPID_PUBLIC_KEY = ""


@app.get("/vapid_public_key")
def get_vapid_public_key():
    return {"public_key": VAPID_PUBLIC_KEY}

@app.post("/subscribe")
def subscribe(subscription: Subscription):
    global subscription_info
    subscription_info = subscription.dict()
    print("Subscription received:", subscription_info)
    return {"message": "Subscription successful"}

@app.post("/push")
def push_notification(message: str = Body(..., embed=True)):
    global subscription_info
    if not subscription_info:
        return {"error": "No subscription found"}
    if not VAPID_PRIVATE_KEY:
        return {"error": "VAPID private key not configured"}

    try:
        webpush(
            subscription_info=subscription_info,
            data=json.dumps({"title": "Test Push", "body": message}),
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_CLAIM_EMAIL}
        )
        return {"message": "Push notification sent"}
    except WebPushException as ex:
        print(f"Error sending push notification: {ex}")
        return {"error": "Failed to send push notification", "details": str(ex)}


# IMPORTANT: Mount the static files directory last.
app.mount("/", StaticFiles(directory="../frontend", html=True), name="static")
