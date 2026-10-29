export interface SystemNotification {
  id: string;
  appId: string;
  appName: string;
  icon: string;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
}
