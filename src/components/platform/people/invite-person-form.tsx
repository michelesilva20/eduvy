"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvitePersonForm({
  invitePath,
  title,
  onCancel,
  onSuccess,
}: {
  invitePath: string;
  title: string;
  onCancel: () => void;
  onSuccess: (inviteToken: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(invitePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        const data = (await response.json()) as { message?: string; inviteToken?: string };
        if (!response.ok) {
          setError(data.message ?? "Não foi possível enviar o convite.");
          return;
        }
        setEmail("");
        onCancel();
        if (data.inviteToken) onSuccess(data.inviteToken);
      } catch {
        setError("Falha de conexão. Tente novamente.");
      }
    });
  }

  return (
    <section
      aria-labelledby="invite-form-title"
      className="mb-6 rounded-[var(--radius-card)] border border-border-light bg-surface-light p-5"
    >
      <h2 id="invite-form-title" className="font-semibold text-text-primary">
        {title}
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        O convite será registrado para este e-mail. O envio por e-mail entra na fila assíncrona futura.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="invite-email">E-mail</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@escola.com"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button disabled={pending || !email.trim()} onClick={submit}>
            Enviar convite
          </Button>
        </div>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
