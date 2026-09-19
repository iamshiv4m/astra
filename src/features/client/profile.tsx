"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useDemo } from "@/lib/store";
import { dateKey } from "@/lib/domain";
import { PageHeading } from "@/components/ui";
import { ClientWorkspace } from "./workspace";
import { ProfileForm } from "./profile-form";
import styles from "./client.module.css";

export function ClientProfile() {
  const { state, actions, error } = useDemo();
  const router = useRouter();
  const client = state.clients.find(item => item.id === state.clientId);
  return (
    <ClientWorkspace>
      <PageHeading
        title="Your profile"
        description="The details that make your conversations a little more personal."
      />
      {client ? (
        <ProfileForm
          key={client.id}
          client={client}
          today={dateKey(state.now)}
          onSave={value => actions.updateClient(value)}
          saveWarning={error}
        />
      ) : null}
      <div className={styles.logout}>
        <button
          className="btn btn-secondary"
          onClick={() => {
            actions.logout("client");
            router.push("/login");
          }}
        >
          <LogOut size={16} /> Sign out
        </button>
        <p className={styles.demoCaption}>Signing out keeps your demo bookings and profile in this browser.</p>
      </div>
    </ClientWorkspace>
  );
}
