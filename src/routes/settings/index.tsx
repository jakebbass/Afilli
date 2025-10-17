import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useRequireAuth } from "~/lib/auth";
import { useTRPC } from "~/trpc/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  User,
  Key,
  Bell,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

type Tab = "profile" | "security" | "notifications";

function SettingsPage() {
  const { user, loading } = useRequireAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "profile" as const, name: "Profile", icon: User },
    { id: "security" as const, name: "Security", icon: Key },
    { id: "notifications" as const, name: "Notifications", icon: Bell },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? "border-primary-600 text-primary-600 dark:text-primary-400"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="max-w-3xl">
          {activeTab === "profile" && <ProfileTab user={user!} />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </Layout>
  );
}

function ProfileTab({ user }: { user: { name: string | null; email: string } }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email);

  const updateProfileMutation = useMutation(
    trpc.auth.updateProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Profile updated successfully");
        queryClient.invalidateQueries({ queryKey: trpc.auth.getCurrentUser.queryKey() });
      },
      onError: (error) => {
        toast.error(`Failed to update profile: ${error.message}`);
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Profile Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Name
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function SecurityTab() {
  const trpc = useTRPC();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const changePasswordMutation = useMutation(
    trpc.auth.changePassword.mutationOptions({
      onSuccess: () => {
        toast.success("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      },
      onError: (error) => {
        toast.error(`Failed to change password: ${error.message}`);
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Change Password
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showCurrentPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showNewPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Key className="h-5 w-5" />
            <span>
              {changePasswordMutation.isPending
                ? "Updating..."
                : "Update Password"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function NotificationsTab() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [agentUpdates, setAgentUpdates] = useState(true);
  const [campaignAlerts, setCampaignAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  const handleSave = () => {
    toast.success("Notification preferences saved");
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        Notification Preferences
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Email Notifications
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive email notifications for important updates
            </p>
          </div>
          <button
            onClick={() => setEmailNotifications(!emailNotifications)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${emailNotifications ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${emailNotifications ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Agent Updates
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Get notified when agents complete tasks
            </p>
          </div>
          <button
            onClick={() => setAgentUpdates(!agentUpdates)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${agentUpdates ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${agentUpdates ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Campaign Alerts
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive alerts about campaign performance
            </p>
          </div>
          <button
            onClick={() => setCampaignAlerts(!campaignAlerts)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${campaignAlerts ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${campaignAlerts ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Weekly Reports
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Receive a weekly summary of your performance
            </p>
          </div>
          <button
            onClick={() => setWeeklyReports(!weeklyReports)}
            className={`
              relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${weeklyReports ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                ${weeklyReports ? "translate-x-5" : "translate-x-0"}
              `}
            />
          </button>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={handleSave}
            className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/50 transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
