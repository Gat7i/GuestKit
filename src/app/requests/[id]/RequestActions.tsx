"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { createClient } from "@/lib/supabase/client-browser";

type RequestActionsProps = {
  requestId: number;
  status: string;
  customerName: string;
  customerUuid: string;
  existingRating?: number | null;
  existingFeedback?: string | null;
};

const ratingLabels = [
  "",
  "Très insatisfait",
  "Insatisfait",
  "Correct",
  "Satisfait",
  "Très satisfait",
];

export default function RequestActions({
  requestId,
  status,
  customerName,
  customerUuid,
  existingRating,
  existingFeedback,
}: RequestActionsProps) {
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState<number>(existingRating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState(existingFeedback || "");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(!!existingRating);
  const [message, setMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) return;
    setCancelling(true);
    try {
      const { error } = await supabase
        .from("customer_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId)
        .eq("customer_id", customerUuid);
      if (error) throw error;
      router.refresh();
    } catch {
      showToast("error", "Erreur lors de l'annulation");
    } finally {
      setCancelling(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from("request_messages").insert({
        request_id: requestId,
        sender_type: "customer",
        sender_name: customerName,
        message: message.trim(),
        is_internal: false,
      });
      if (error) throw error;
      setMessage("");
      showToast("success", "Message envoyé");
      router.refresh();
    } catch {
      showToast("error", "Erreur lors de l'envoi");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return;
    setSubmittingRating(true);
    try {
      const { error } = await supabase
        .from("customer_requests")
        .update({ rating, feedback: feedback.trim() || null })
        .eq("id", requestId)
        .eq("customer_id", customerUuid);
      if (error) throw error;
      setRatingSubmitted(true);
      showToast("success", "Merci pour votre avis !");
      router.refresh();
    } catch {
      showToast("error", "Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmittingRating(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Ajouter un message */}
      {status !== "cancelled" && (
        <div
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #E8DEDA" }}
        >
          <h2
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: "#1C1211" }}
          >
            <div
              className="w-1 h-4 rounded-full"
              style={{ backgroundColor: "#C49A5A" }}
            />
            Ajouter un message
          </h2>
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Précisez votre demande au service…"
              className="flex-1 rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-[#E05947] focus:border-[#E05947]"
              disabled={sendingMessage}
            />
            <button
              type="submit"
              disabled={!message.trim() || sendingMessage}
              className="btn-primary disabled:opacity-40 whitespace-nowrap"
            >
              {sendingMessage ? "…" : "Envoyer"}
            </button>
          </form>
        </div>
      )}

      {/* Évaluation — service terminé */}
      {status === "completed" && (
        <div
          className="bg-white rounded-xl p-5"
          style={{ border: "1px solid #E8DEDA" }}
        >
          <h2
            className="text-sm font-semibold mb-4 flex items-center gap-2"
            style={{ color: "#1C1211" }}
          >
            <div
              className="w-1 h-4 rounded-full"
              style={{ backgroundColor: "#C49A5A" }}
            />
            {ratingSubmitted ? "Votre évaluation" : "Évaluez ce service"}
          </h2>

          {ratingSubmitted ? (
            <div className="text-center py-2">
              {/* Étoiles affichées (lecture seule) */}
              <div className="flex justify-center gap-1.5 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className="text-xl select-none"
                    style={{ color: s <= rating ? "#C49A5A" : "#E8DEDA" }}
                  >
                    ★
                  </span>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs mb-2" style={{ color: "#746865" }}>
                  {ratingLabels[rating]}
                </p>
              )}
              {feedback && (
                <p
                  className="text-sm px-4 py-3 rounded-lg text-left"
                  style={{ color: "#1C1211", backgroundColor: "#F5EFED" }}
                >
                  {feedback}
                </p>
              )}
              <button
                onClick={() => setRatingSubmitted(false)}
                className="mt-3 text-xs hover:underline transition"
                style={{ color: "#746865" }}
              >
                Modifier mon avis
              </button>
            </div>
          ) : (
            <form onSubmit={handleRatingSubmit} className="space-y-4">
              {/* Étoiles interactives */}
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-2xl transition-transform hover:scale-110 focus:outline-none select-none"
                    style={{
                      color: s <= displayRating ? "#C49A5A" : "#E8DEDA",
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {displayRating > 0 && (
                <p className="text-center text-xs" style={{ color: "#746865" }}>
                  {ratingLabels[displayRating]}
                </p>
              )}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Commentaire optionnel…"
                className="w-full rounded-lg border-gray-200 text-sm focus:ring-2 focus:ring-[#E05947] focus:border-[#E05947]"
              />
              <button
                type="submit"
                disabled={!rating || submittingRating}
                className="btn-primary w-full justify-center disabled:opacity-40"
              >
                {submittingRating ? "Envoi…" : "Envoyer mon évaluation"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-3">
        {status === "pending" && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="btn-danger disabled:opacity-50"
          >
            {cancelling ? "Annulation…" : "Annuler la demande"}
          </button>
        )}
        <Link href="/requests" className="btn-ghost">
          ← Retour aux demandes
        </Link>
      </div>
    </div>
  );
}
