/**
 * Browser Notification Manager for Talking Davi Lucas.
 * Handles permission requests, low hunger & energy reminders, and tab focus triggers.
 */

export type NotificationStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private lastHungerAlertTime: number = 0;
  private lastEnergyAlertTime: number = 0;
  private readonly alertCooldownMs = 3 * 60 * 1000; // 3 minutes cooldown

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationStatus {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission as NotificationStatus;
  }

  public async requestPermission(): Promise<NotificationStatus> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      return result as NotificationStatus;
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      return 'denied';
    }
  }

  public sendHungerReminder(
    hungerLevel: number,
    onNotificationClick?: () => void
  ): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;

    const now = Date.now();
    if (now - this.lastHungerAlertTime < this.alertCooldownMs) return false;
    this.lastHungerAlertTime = now;

    try {
      const title = `🍕 Davi Lucas is hungry! (${hungerLevel}%)`;
      const options: NotificationOptions = {
        body: "Davi's stomach is rumbling! Come back and feed him a slice of pizza or hot chili!",
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🍕</text></svg>',
        tag: 'davi-hunger-alert',
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onNotificationClick) {
          onNotificationClick();
        }
      };

      return true;
    } catch (err) {
      console.warn('Error displaying hunger notification:', err);
      return false;
    }
  }

  public sendEnergyReminder(
    energyLevel: number,
    onNotificationClick?: () => void
  ): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') return false;

    const now = Date.now();
    if (now - this.lastEnergyAlertTime < this.alertCooldownMs) return false;
    this.lastEnergyAlertTime = now;

    try {
      const title = `💤 Davi Lucas is exhausted! (${energyLevel}%)`;
      const options: NotificationOptions = {
        body: "Davi is yawning and needs some rest. Come back to play or let him take a quick power nap!",
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💤</text></svg>',
        tag: 'davi-energy-alert',
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onNotificationClick) {
          onNotificationClick();
        }
      };

      return true;
    } catch (err) {
      console.warn('Error displaying energy notification:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
