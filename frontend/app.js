// --- Service Worker Registration ---
if ('serviceWorker' in navigator && 'PushManager' in window) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
} else {
    console.warn('Push messaging is not supported');
}

// --- Subscription Logic ---
const subscribeButton = document.getElementById('subscribeButton');

subscribeButton.addEventListener('click', () => {
    subscribeUser();
});

async function subscribeUser() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
            console.log('User is already subscribed.');
            return;
        }

        const applicationServerKey = await getVapidPublicKey();
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(applicationServerKey),
        });

        console.log('New subscription:', subscription);
        await sendSubscriptionToServer(subscription);

    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
    }
}

async function getVapidPublicKey() {
    const response = await fetch('/vapid_public_key');
    const data = await response.json();
    console.log('Fetched VAPID public key:', data.public_key);
    return data.public_key;
}

async function sendSubscriptionToServer(subscription) {
    const response = await fetch('/subscribe', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
    });

    if (response.ok) {
        console.log('Subscription sent to server successfully.');
    } else {
        console.error('Failed to send subscription to server.');
    }
}


// --- Helper function to convert VAPID key ---
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
