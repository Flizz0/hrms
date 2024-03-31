import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching"
import { clientsClaim } from "workbox-core"

import { initializeApp } from "firebase/app"
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw"

// Use the precache manifest generated by Vite
precacheAndRoute(self.__WB_MANIFEST)

// Clean up old caches
cleanupOutdatedCaches()

const jsonConfig = new URL(location).searchParams.get("config")

// Firebase config initialization
try {
	const firebaseApp = initializeApp(JSON.parse(jsonConfig))
	const messaging = getMessaging(firebaseApp)

	function isChrome() {
		return navigator.userAgent.toLowerCase().includes("chrome")
	}

	onBackgroundMessage(messaging, (payload) => {
		const notificationTitle = payload.data.title
		let notificationOptions = {
			body: payload.data.body || "",
		}
		if (payload.data.notification_icon) {
			notificationOptions["icon"] = payload.data.notification_icon
		}
		if (isChrome()) {
			notificationOptions["data"] = {
				url: payload.data.click_action,
			}
		} else {
			if (payload.data.click_action) {
				notificationOptions["actions"] = [
					{
						action: payload.data.click_action,
						title: "View Details",
					},
				]
			}
		}
		self.registration.showNotification(notificationTitle, notificationOptions)
	})

	self.addEventListener("notificationclick", (event) => {
		console.log("event", event)
		event.preventDefault()
		event.notification.close()

		if (event.action) {
			event.waitUntil(clients.openWindow(event.action))
		} else if (event.notification?.data) {
			event.waitUntil(clients.openWindow(event.notification.data));
		}
	})
} catch (error) {
	console.log("Failed to initialize Firebase", error)
}

self.skipWaiting()
clientsClaim()
console.log("Service Worker Initialized")